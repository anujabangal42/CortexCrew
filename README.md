# CortexCrew – Pharmacogenomic Risk Prediction System

Multi-city Hackathon • RIFT 2026 • HealthTech Track  
Track: Pharmacogenomics / Explainable AI  

---

## Live Demo

Hosted Application: [https://cortexcrew.onrender.com](https://cortexcrew.onrender.com)  
Demo Video (LinkedIn): https://linkedin.com/your-demo-link  

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

## Project Structure

```
CortexCrew/
│
├── app.py
├── requirements.txt
├── README.md
├── render.yaml
├── .gitignore
├── .env (not tracked in git)
│
├── templates/
│ └── index.html
│
└── static/
    ├── style.css
    └── app.js
```


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

**Supported Drugs:**
- CODEINE
- WARFARIN
- CLOPIDOGREL
- SIMVASTATIN
- AZATHIOPRINE
- FLUOROURACIL

**Supports:**
- Single drug
- Multiple drugs (comma-separated)

---

## Output Schema

The application returns structured JSON in this exact format:

```json
{
  "results": [
    {
      "patient_id": "PATIENT_XXX",
      "drug": "DRUG_NAME",
      "timestamp": "ISO8601_timestamp",
      "risk_assessment": {
        "risk_label": "Safe|Toxic|Ineffective|Unknown",
        "confidence_score": 0.0,
        "severity": "low|moderate|high|critical"
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
        "recommended_action": "Text recommendation"
      },
      "llm_generated_explanation": {
        "summary": "AI-generated clinical explanation"
      },
      "quality_metrics": {
        "vcf_parsing_success": true
      }
    }
  ]
}
```
---
## API Documentation

### POST `/analyze`

**Endpoint:** `/analyze`  
**Method:** `POST`  
**Content-Type:** `multipart/form-data`

| Field     | Type               | Required | Description |
|-----------|--------------------|----------|-------------|
| `vcf_file` | File (`.vcf`)      | Yes      | Variant Call Format file (VCF v4.2, max 5MB) |
| `drugs`   | String (comma-separated) | Yes      | Drug names separated by commas (e.g., `CODEINE,WARFARIN`) |

**Response:** JSON object with `results` array containing risk assessments for each drug.

---


## Installation Guide

1️⃣ Clone Repository
```bash
git clone https://github.com/anujabangal42/CortexCrew.git
cd CortexCrew
```

2️⃣ Create Virtual Environment

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

3️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

4️⃣ Configure Environment Variables

Create `.env` file in the root directory:
```env
OPENROUTER_API_KEY=your_openrouter_key
```

5️⃣ Run Application
```bash
python app.py
```

Open in browser:
```
http://127.0.0.1:5000
```

---
## Deployment on Render

1️⃣ **Push project to GitHub**
   - Repository: https://github.com/anujabangal42/CortexCrew

2️⃣ **Go to [Render.com](https://render.com)**
   - Sign in with your GitHub account

3️⃣ **Create new Web Service**
   - Click **New** → **Web Service**
   - Connect your GitHub account and select the **CortexCrew** repository

4️⃣ **Configure Settings**
   - Render will auto-detect `render.yaml` configuration
   - If configuring manually:
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `gunicorn -w 2 -b 0.0.0.0:$PORT app:app`

5️⃣ **Add Environment Variable**
   - **Key:** `OPENROUTER_API_KEY`
   - **Value:** Your OpenRouter API key (from your `.env` file)

6️⃣ **Deploy**
   - Click **Create Web Service**
   - Wait for deployment to complete
   - Your app will be available at `https://cortexcrew.onrender.com`

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is part of the RIFT 2026 Hackathon submission.

---

## Author

**Anuja Bangal**
- GitHub: [@anujabangal42](https://github.com/anujabangal42)

