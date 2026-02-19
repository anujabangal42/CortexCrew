# PharmaGuard – Pharmacogenomic Risk Prediction System

Multi-city Hackathon • RIFT 2026 • HealthTech Track  
Track: Pharmacogenomics / Explainable AI  

---

## Live Demo

🔗 Hosted Application: https://your-render-url.onrender.com  
🎥 Demo Video (LinkedIn): https://linkedin.com/your-demo-link  

---

## Problem Statement

Adverse Drug Reactions (ADRs) cause over 100,000 deaths annually.  
Many of these are preventable using **pharmacogenomic testing**, which analyzes how genetic variants influence drug metabolism.

This project builds an AI-powered web system that:

- Parses authentic **VCF (Variant Call Format v4.2)** genomic files
- Identifies pharmacogenomic variants in 6 critical genes:
  - CYP2D6
  - CYP2C19
  - CYP2C9
  - SLCO1B1
  - TPMT
  - DPYD
- Predicts drug-specific risks:
  - Safe
  - Adjust Dosage
  - Toxic
  - Ineffective
  - Unknown
- Provides CPIC-aligned dosing recommendations
- Generates AI-powered clinical explanations using LLM

---

## Architecture Overview

VCF File Upload
↓
Variant Extraction
↓
Gene-wise Filtering (6 PGx Genes)
↓
Diplotype & Phenotype Inference
↓
CPIC Rule Engine (Base Decision)
↓
Risk Assessment Layer
↓
LLM Clinical Explanation (OpenRouter)
↓
Structured JSON Output


---

## Tech Stack

### Backend
- Python 3.12
- Flask
- OpenRouter API (LLM)
- Requests
- dotenv

### Frontend
- HTML
- CSS
- Javascript

### Deployment
- GitHub
- Render

---

##  Project Structure

PharmaGuard/
│
├── app.py
├── requirements.txt
├── README.md
├── .env
│
├── templates/
│ └── index.html
│
└── static/
└── style.css
└── app.js


---

## Input Requirements

### 1️⃣ VCF File Upload

- Format: `.vcf`
- Version: VCFv4.2
- Max Size: 5MB
- Must contain INFO tags:
  - GENE
  - STAR
  - RS

---

### 2️⃣ Drug Name Input

Supported Drugs:

- CODEINE
- WARFARIN
- CLOPIDOGREL
- SIMVASTATIN
- AZATHIOPRINE
- FLUOROURACIL

Supports:
- Single drug
- Multiple drugs (comma-separated)

---

## Output Schema

The application returns structured JSON in this exact format:

```json
{
  "patient_id": "PATIENT_XXX",
  "drug": "DRUG_NAME",
  "timestamp": "ISO8601_timestamp",
  "risk_assessment": {
    "risk_label": "Safe|Adjust Dosage|Toxic|Ineffective|Unknown",
    "confidence_score": 0.0,
    "severity": "none|low|moderate|high|critical"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "GENE_SYMBOL",
    "diplotype": "*X/*Y",
    "phenotype": "PM|IM|NM|RM|URM|Unknown",
    "detected_variants": [
      { "rsid": "rsXXXX" }
    ]
  },
  "clinical_recommendation": {
    "recommended_action": "Text recommendation",
    "guideline_source": "CPIC 2023"
  },
  "llm_generated_explanation": {
    "summary": "AI-generated clinical explanation"
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "variant_count": 2
  }
}

---
## API Documentation

| Field     | Type               | Required | Description |
|-----------|--------------------|----------|------------|
| `vcf_file` | File (`.vcf`)      | Yes   | Variant Call Format file (VCF v4.2, max 5MB) |
| `drugs`   | String (comma-separated) | Yes   | Drug names separated by commas (e.g., `CODEINE,WARFARIN`) |

---


## Installation Guide

1️⃣ Clone Repository
git clone https://github.com/your-username/PharmaGuard.git
cd PharmaGuard

2️⃣ Create Virtual Environment

Windows:

python -m venv myenv
myenv\Scripts\activate


Mac/Linux:

python3 -m venv myenv
source myenv/bin/activate

3️⃣ Install Dependencies
pip install -r requirements.txt

4️⃣ Configure Environment Variables

Create .env file:

OPENROUTER_API_KEY=your_openrouter_key

5️⃣ Run Application
python app.py


Open in browser:

http://127.0.0.1:5000

---
## Deployment on Render

Push project to GitHub

Go to Render

Create new Web Service

Connect GitHub repo

Set:

Build Command: pip install -r requirements.txt

Start Command: python app.py

Add environment variable:

OPENROUTER_API_KEY

Deploy

