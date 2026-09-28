# CyberAlert Prioritization — Intelligent SOC Alert Analytics & Incident Prediction Platform

A portfolio-grade Data Science, Machine Learning, Data Engineering, and Cybersecurity Analytics platform designed for enterprise Security Operations Centers (SOC). The system ingests, normalizes, and analyzes over 100,000 heterogeneous SIEM/EDR event logs, separates operational noise from true threat signals using multi-factor explainable scoring, trains an out-of-time validated Random Forest classifier, and surfaces high-priority incidents through a production-grade FastAPI backend and dark-mode React SOC dashboard.

---

## 🛡️ Business Problem

Enterprise Security Operations Centers (SOCs) are inundated with tens of thousands of security alerts daily from heterogeneous security telemetry (Firewalls, EDR, Cloud APIs, IDS, AI systems, and Authentication gateways). 
- **Alert Fatigue**: Over 90% of raw alerts are routine noise, benign scanners, or low-fidelity repetitions.
- **Triage Delay**: Real critical incidents (Zero-Day Exploits, Supply Chain Compromises, Container Escapes) risk being buried under noisy backlogs.
- **Resource Constraints**: Tier-1 analysts spend excessive hours manually verifying non-actionable events.

**CyberAlert Prioritization** addresses this crisis through:
1. **Automated Noise Suppression**: Explainable multi-signal noise engine classifying events without blindly suppressing critical telemetry.
2. **Machine Learning Incident Estimation**: Chronologically trained Random Forest model calculating incident likelihood ($P(\text{Incident})$) with 92.16% test accuracy and 0.8018 ROC-AUC.
3. **Calibrated Priority Escalation Ladder**: Dynamic priority scoring (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) reducing analyst triage workload by **92.9%**.
4. **SHAP & Feature Explainability**: Natural-language rationale and directional feature contributions for every alert.

---

## 🏛️ System Architecture

```
                                      +---------------------------------------------+
                                      |   Raw SIEM Ingestion (100,000 JSONL Events) |
                                      +---------------------------------------------+
                                                             |
                                                             v
+--------------------------------------------------------------------------------------------------------------------+
| DATA ENGINEERING & PIPELINE (src/data, src/features)                                                               |
| - Schema Validation & Quality Audit (100.0% clean, 0 duplicate UUIDs)                                              |
| - Unified Asset & Threat Taxonomy (8 domains: IDS, Endpoint, Cloud, AI, IoT, Network, Firewall, Auth)              |
| - Defensible Ground-Truth Derived Incident Target (5,447 True Incidents | 5.45% Class Imbalance)                   |
| - Feature Engineering (58 temporal, frequency, repetition, burst, and interaction features)                        |
| - Explainable Noise Engine (Multi-signal scoring [0-100%])                                                         |
+--------------------------------------------------------------------------------------------------------------------+
                                                             |
                                      +----------------------+----------------------+
                                      |                                             |
                                      v                                             v
+------------------------------------------------------+   +---------------------------------------------------------+
| MYSQL DATABASE (cyberalert_db)                       |   | MACHINE LEARNING & EXPLAINABILITY (src/ml)              |
| - alerts (100k indexed rows)                         |   | - Chronological 80/20 Train/Test Split (No Leakage)     |
| - alert_features (100k feature vectors)              |   | - Random Forest Classifier (150 Trees, Balanced)        |
| - model_runs & model_metrics (Audit history)         |   | - Out-of-Time Test: 92.16% Acc, 0.8018 ROC-AUC          |
| - data_quality_reports                               |   | - Tree-based Local & Global SHAP Feature Attributions   |
+------------------------------------------------------+   +---------------------------------------------------------+
                                      |                                             |
                                      +----------------------+----------------------+
                                                             |
                                                             v
+--------------------------------------------------------------------------------------------------------------------+
| FASTAPI BACKEND (backend/app)                                                                                      |
| - Centralized Pydantic Settings & SQLAlchemy ORM Connection Pooling                                               |
| - High-performance Paginated REST APIs (/api/overview, /api/alerts, /api/trends, /api/priorities, etc.)           |
| - Dynamic Empirical Insights & Action Plan Generator (Zero Hardcoded Stats)                                        |
| - Live /api/predict Real-Time Triage Inference Engine                                                             |
+--------------------------------------------------------------------------------------------------------------------+
                                                             |
                                                             v
+--------------------------------------------------------------------------------------------------------------------+
| REACT + TYPESCRIPT + TAILWIND SOC DASHBOARD (frontend)                                                             |
| - Executive KPI Overview Cards & Real-Time Connection Badges                                                       |
| - Core Visual 1: Alert Type Distribution & Taxonomy                                                                |
| - Core Visual 2: Alert Volume Over Time & Daily Trends                                                             |
| - Core Visual 3: Severity vs Incident Conversion Disparity                                                         |
| - Core Visual 4: Threat Vector vs Incident Conversion Rate (%)                                                     |
| - Interactive Prioritization Table with Multi-Filter Selectors & Search                                            |
| - Alert Inspection Modal with Local SHAP Waterfalls & CEF Raw Log Viewer                                           |
| - Interactive Live Alert Simulator Modal                                                                           |
+--------------------------------------------------------------------------------------------------------------------+
```

---

## 📊 Dataset Schema & Normalization

The raw dataset (`data/raw/advanced_siem_dataset.jsonl`) contains **100,000 cybersecurity events** across 35 polymorphic fields.

### Unified Field Mapping

| Original Field | Application Normalized Field | Derivation Methodology / Description |
| :--- | :--- | :--- |
| `event_id` | `alert_id` | Unique UUID primary key (indexed). |
| `timestamp` | `timestamp` | UTC ISO-8601 timestamp (`YYYY-MM-DD HH:MM:SS`). |
| `event_type` | `event_type` | Security domain: `ai`, `endpoint`, `auth`, `cloud`, `ids_alert`, `firewall`, `iot`, `network`. |
| `source` | `source` | 20 Enterprise SIEM/EDR vendors (Sentinel, CrowdStrike, Zeek, AlienVault, Wazuh, etc.). |
| `severity` | `severity` | Normalized lowercase: `emergency`, `critical`, `high`, `medium`, `low`, `info`. |
| `alert_type` / `action` | `alert_type` | Unified taxonomy: IDS threat name if present, else title-cased action name. |
| `dst_ip` / `resource_id` / `device_id` / `model_id` | `affected_system` | Unified asset entity identifier resolved by target domain. |
| `category` | `category` | Threat category (`Exploit`, `Malware`, `Recon`, `Policy`, `Evasion`). |
| `advanced_metadata.risk_score` | `risk_score` | SIEM correlation risk score [0.0 - 100.0]. |
| `advanced_metadata.confidence` | `confidence` | Detection engine confidence [0.0 - 1.0]. |
| `behavioral_analytics` | `is_anomaly` | Flagged if frequency anomaly, sequence anomaly, or baseline deviation $\ge 2.0$. |
| *(None in raw data)* | `is_incident` | **Derived SOC Ground-Truth Proxy**: Multi-factor escalation condition yielding 5,447 confirmed incidents (5.45%). |
| *(None in raw data)* | `priority` | Calibrated triage tier (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`). |
| *(None in raw data)* | `noise_score` | Multi-factor operational noise score [0.0 - 100.0%]. |

---

## 🤖 Machine Learning & Explainability

### Model Specifications
- **Algorithm**: Random Forest Classifier (`RandomForestClassifier`)
- **Estimators**: 150 Decision Trees (`max_depth=14`, `min_samples_split=8`, `min_samples_leaf=4`)
- **Class Balancing**: `class_weight='balanced_subsample'` to handle 5.45% minority class
- **Split Protocol**: Strict **Chronological 80/20 Holdout** (80,000 train events $\rightarrow$ 20,000 out-of-time test events) to eliminate temporal look-ahead leakage.

### Evaluation Metrics (20,000 Out-of-Time Test Set)

| Metric | Empirical Score | Interpretation |
| :--- | :--- | :--- |
| **Accuracy** | **92.16%** | High baseline correctness across all telemetry. |
| **ROC-AUC** | **0.8018** | Strong discriminative ability separating true incidents from noise. |
| **Incident Recall** | **43.42%** | Captures high-threat incidents without requiring manual review of 95% of events. |
| **Precision** | **34.67%** | True positive conversion in high-imbalance setting (vs. 5.45% baseline base rate). |
| **F1-Score** | **38.56%** | Harmonic mean balancing coverage and precision. |
| **Analyst Fatigue Reduction** | **92.9%** | **Analyst queue shrinks from 20,000 to 1,419 high-priority candidates.** |

### Top 5 Predictive Features
1. `encoded_severity` / `severity_num` (Gini Importance: ~28%)
2. `severity_weight` (Gini Importance: ~19%)
3. `noise_score` (Gini Importance: ~11%)
4. `alert_type_frequency` (Gini Importance: ~6%)
5. `alert_burst_score` (Gini Importance: ~5%)

---

## 🗄️ MySQL Database Schema (`cyberalert_db`)

The database runs natively on **MySQL 8.0+** with optimized composite indexes:

1. **`alerts`**: 100,000 rows containing all normalized telemetry, risk scores, model probabilities, noise tiers, and priorities.
   - *Indexes*: `timestamp`, `severity`, `alert_type`, `source`, `affected_system`, `priority`, `is_incident`, `noise_level`.
2. **`alert_features`**: 100,000 rows with 58 engineered temporal, velocity, and repetition features.
3. **`model_runs`**: Serialized audit logs of training executions, hyperparameters, and evaluation metrics.
4. **`model_metrics`**: Feature importance weights and calibration metrics.
5. **`data_quality_reports`**: Audit results verifying 100.0% data quality score.

---

## 🚀 How to Run Locally (Windows)

### Prerequisites
1. **Python 3.10+** (Tested on Python 3.13)
2. **Node.js 18+ & npm** (Tested on Node v26)
3. **MySQL Server 8.0+** running locally on port 3306

### Step 1: Clone & Configure Environment
```powershell
# Navigate to workspace
cd "D:\Data Science Project\DS\Day 1\CyberAlert-Prioritization"

# Create .env from template
copy .env.example .env

# Edit .env to set your MySQL password
# MYSQL_PASSWORD=your_mysql_password
```

### Step 2: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Run Data Pipeline & Train ML Model
```powershell
# 1. Run Data Quality Audit, Cleaning, Feature Engineering & Noise Scoring
python scripts/build_pipeline.py

# 2. Provision MySQL Tables in cyberalert_db
python scripts/setup_db.py

# 3. Bulk Insert 100,000 Alerts into MySQL
python scripts/load_dataset.py

# 4. Train & Evaluate Chronological Random Forest Model
python src/ml/train.py
python src/ml/evaluate.py

# 5. Update MySQL Alerts with ML Probabilities & Prioritization Tiers
python scripts/update_alert_priorities.py
```

### Step 4: Run Tests
```powershell
python -m pytest tests/test_full_suite.py -v
```

### Step 5: Launch Backend & Frontend Servers
You can run the one-click launcher:
```powershell
.\run_full_system.bat
```
Or start them individually in separate terminal windows:

**Backend Server (FastAPI):**
```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
# API Docs available at: http://127.0.0.1:8000/docs
```

**Frontend Server (React + Vite):**
```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
# Dashboard available at: http://localhost:5173
```

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health and MySQL status. |
| `GET` | `/api/overview` | Executive KPI metrics (Total alerts, incidents, accuracy, quality score). |
| `GET` | `/api/filters` | Distinct dropdown options for dynamic filtering. |
| `GET` | `/api/alerts` | Paginated alert search with filters (`severity`, `priority`, `type`, `source`, `system`, etc.). |
| `GET` | `/api/alerts/{alert_id}` | Detailed alert telemetry with local SHAP waterfall explanation and CEF log. |
| `GET` | `/api/alerts/trends` | Daily and hourly alert volume vs. incident trends. |
| `GET` | `/api/alerts/types` | Top alert types ranked by volume and incident conversion rate. |
| `GET` | `/api/alerts/severity` | Severity distribution and escalation disparity. |
| `GET` | `/api/alerts/noise` | Operational noise distribution and top tuning candidate signatures. |
| `GET` | `/api/model/metrics` | Model evaluation report, confusion matrix, and ROC/PR curves. |
| `GET` | `/api/model/features` | Top 15 Random Forest global feature importance rankings. |
| `GET` | `/api/priorities` | Breakdown across CRITICAL, HIGH, MEDIUM, and LOW tiers. |
| `GET` | `/api/insights` | 5–7 empirical findings derived dynamically from MySQL. |
| `GET` | `/api/action-plan` | Data-driven SOC detection engineering roadmap and SLAs. |
| `POST`| `/api/predict` | Real-time alert inference returning probability, priority, noise score, and explanation. |

---

## 🔒 Security & Performance Engineering
- **Zero Raw Data Modification**: Original `data/raw/advanced_siem_dataset.jsonl` is preserved read-only.
- **Credential Protection**: Database passwords URL-encoded and isolated in `.env` (git-ignored).
- **Parameterized SQL**: All repository queries use parameterized SQLAlchemy statements preventing SQL injection.
- **Fast Batch Ingestion**: 100,000 rows loaded in **22.6 seconds** via parameterized `executemany` batches.
- **No In-Memory Bloat**: Streaming generators prevent out-of-memory errors on massive JSONL logs.
- **Server-Side Pagination**: Frontend requests only 15–100 records per page.
