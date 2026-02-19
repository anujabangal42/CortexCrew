import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List

import requests
from flask import Flask, render_template, request, Response
from dotenv import load_dotenv

# ----------------------------
# CONFIG
# ----------------------------

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = Flask(__name__)

SUPPORTED_DRUGS = [
    "CODEINE",
    "WARFARIN",
    "CLOPIDOGREL",
    "SIMVASTATIN",
    "AZATHIOPRINE",
    "FLUOROURACIL",
]

DRUG_GENE_MAP = {
    "CODEINE": "CYP2D6",
    "WARFARIN": "CYP2C9",
    "CLOPIDOGREL": "CYP2C19",
    "SIMVASTATIN": "SLCO1B1",
    "AZATHIOPRINE": "TPMT",
    "FLUOROURACIL": "DPYD"
}

# ----------------------------
# VCF PARSER
# ----------------------------

def parse_vcf(file_storage) -> Dict[str, Any]:

    variants = []
    sample_id = "PATIENT_001"
    parsing_success = False

    try:
        content = file_storage.read().decode("utf-8", errors="ignore")
        lines = content.splitlines()

        for line in lines:

            if line.startswith("##"):
                continue

            if line.startswith("#CHROM"):
                parts = line.split("\t")
                if len(parts) > 9:
                    sample_id = parts[9]
                continue

            if line.startswith("#") or not line.strip():
                continue

            fields = line.split("\t")
            if len(fields) < 8:
                continue

            chrom, pos, vid, ref, alt, _, _, info = fields[:8]

            info_dict = {}
            for kv in info.split(";"):
                if "=" in kv:
                    k, v = kv.split("=", 1)
                    info_dict[k] = v

            variants.append({
                "gene": info_dict.get("GENE", "").upper(),
                "star": info_dict.get("STAR", ""),
                "rsid": info_dict.get("RS", vid)
            })

        parsing_success = True

    except Exception:
        parsing_success = False

    return {
        "parsing_success": parsing_success,
        "sample_id": sample_id,
        "variants": variants
    }

# ----------------------------
# PHENOTYPE
# ----------------------------

def infer_gene_profile(variants: List[Dict], gene: str):

    gene_vars = [v for v in variants if v["gene"] == gene]
    stars = [v["star"] for v in gene_vars if v["star"]]

    if len(stars) >= 2:
        diplotype = f"{stars[0]}/{stars[1]}"
    elif len(stars) == 1:
        diplotype = f"{stars[0]}/*1"
    else:
        diplotype = "*1/*1"

    phenotype = "NM"

    if any(x in diplotype for x in ["*2/*2", "*3/*3", "*4/*4", "*2A"]):
        phenotype = "PM"
    elif any(x in diplotype for x in ["*2", "*3", "*4", "*10", "*17"]):
        phenotype = "IM"

    if phenotype not in ["PM", "IM", "NM", "RM", "URM"]:
        phenotype = "Unknown"

    return {
        "primary_gene": gene,
        "diplotype": diplotype,
        "phenotype": phenotype,
        "detected_variants": [
            {"rsid": v["rsid"]} for v in gene_vars
        ]
    }

# ----------------------------
# RISK ENGINE
# ----------------------------

def evaluate_risk(gene_profile: Dict[str, Any], drug: str):

    phenotype = gene_profile["phenotype"]

    risk_label = "Safe"
    severity = "low"
    confidence_score = 0.7
    dosing_note = "Standard dosing recommended."

    if drug == "CODEINE" and phenotype == "PM":
        risk_label = "Ineffective"
        severity = "high"
        confidence_score = 0.9
        dosing_note = "Avoid codeine."

    if drug == "WARFARIN" and phenotype == "PM":
        risk_label = "Toxic"
        severity = "critical"
        confidence_score = 0.95
        dosing_note = "Reduce starting dose."

    return {
        "risk_label": risk_label,
        "confidence_score": float(confidence_score),
        "severity": severity,
        "dosing_note": dosing_note
    }

# ----------------------------
# LLM
# ----------------------------

def generate_explanation(drug, gene_profile, risk):

    fallback = (
        f"{gene_profile['primary_gene']} {gene_profile['diplotype']} "
        f"affects metabolism of {drug}. Risk: {risk['risk_label']}. "
        f"Recommendation: {risk['dosing_note']}"
    )

    if not OPENROUTER_API_KEY:
        return {"summary": fallback}

    prompt = f"""
Write a concise 2-3 sentence pharmacogenomic explanation.

Drug: {drug}
Gene: {gene_profile['primary_gene']}
Diplotype: {gene_profile['diplotype']}
Phenotype: {gene_profile['phenotype']}
Risk: {risk['risk_label']}
Recommendation: {risk['dosing_note']}
"""

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "meta-llama/llama-3-8b-instruct",
                "messages": [
                    {"role": "system", "content": "You are a pharmacogenomics expert."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 150
            },
            timeout=60
        )

        result = response.json()

        if "choices" not in result:
            return {"summary": fallback}

        return {
            "summary": result["choices"][0]["message"]["content"].strip()
        }

    except Exception:
        return {"summary": fallback}

# ----------------------------
# ROUTES
# ----------------------------

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html", supported_drugs=SUPPORTED_DRUGS)

@app.route("/analyze", methods=["POST"])
def analyze():

    if "vcf_file" not in request.files:
        return Response(json.dumps({"error": "No VCF file uploaded."}), mimetype="application/json")

    file = request.files["vcf_file"]
    drugs = request.form.get("drugs", "").upper().split(",")
    drugs = [d.strip() for d in drugs if d.strip()]

    vcf_data = parse_vcf(file)
    results = []

    for drug in drugs:

        if drug not in SUPPORTED_DRUGS:
            continue

        gene = DRUG_GENE_MAP[drug]
        gene_profile = infer_gene_profile(vcf_data["variants"], gene)
        risk = evaluate_risk(gene_profile, drug)
        explanation = generate_explanation(drug, gene_profile, risk)

        # EXACT SCHEMA ORDER
        result_object = {

            "patient_id": vcf_data["sample_id"],

            "drug": drug,

            "timestamp": datetime.now(timezone.utc).isoformat(),

            "risk_assessment": {
                "risk_label": risk["risk_label"],
                "confidence_score": risk["confidence_score"],
                "severity": risk["severity"]
            },

            "pharmacogenomic_profile": {
                "primary_gene": gene_profile["primary_gene"],
                "diplotype": gene_profile["diplotype"],
                "phenotype": gene_profile["phenotype"],
                "detected_variants": gene_profile["detected_variants"]
            },

            "clinical_recommendation": {
                "recommended_action": risk["dosing_note"]
            },

            "llm_generated_explanation": explanation,

            "quality_metrics": {
                "vcf_parsing_success": vcf_data["parsing_success"]
            }

        }

        results.append(result_object)

    return Response(
        json.dumps({"results": results}, indent=2),
        mimetype="application/json"
    )

if __name__ == "__main__":
    app.run(debug=True)
