"""
CyberAlert-Prioritization: Comprehensive Automated Test Suite
Covers Database, Raw Ingestion, Validation, Cleaning, Features, Noise Engine,
ML Model, Prioritization, Explainability, and FastAPI Endpoints.
"""

import os
import sys
import json
import pytest
from pathlib import Path
import pymysql
import pandas as pd
from fastapi.testclient import TestClient

# Ensure root on path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.main import app
from backend.app.core.config import settings
from src.data.ingestion import stream_jsonl
from src.data.cleaning import clean_single_record
from src.features.feature_engineering import engineer_features
from src.analysis.noise_analysis import calculate_noise_scores
from src.ml.predict import get_predictor
from src.ml.prioritization import calculate_priority_score
from src.explainability.shap_analysis import ModelExplainer


@pytest.fixture(scope="module")
def api_client():
    return TestClient(app)


def test_database_connection():
    """Validates active connection to MySQL cyberalert_db and verifies table existence."""
    conn = pymysql.connect(
        host=settings.MYSQL_HOST,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DATABASE,
        charset="utf8mb4"
    )
    with conn.cursor() as cur:
        cur.execute("SELECT DATABASE(), VERSION();")
        db_name, version = cur.fetchone()
        assert db_name == "cyberalert_db"
        assert "8.0" in version

        cur.execute("SELECT COUNT(*) FROM alerts;")
        alert_count = cur.fetchone()[0]
        assert alert_count == 100000

        cur.execute("SELECT COUNT(*) FROM alert_features;")
        feat_count = cur.fetchone()[0]
        assert feat_count == 100000
    conn.close()


def test_raw_dataset_integrity():
    """Verifies the raw SIEM dataset file is present and intact."""
    raw_path = Path("data/raw/advanced_siem_dataset.jsonl")
    assert raw_path.exists(), "Raw dataset file missing"
    assert raw_path.stat().st_size >= 80 * 1024 * 1024, "Raw dataset file size unexpected"

    # Stream first 5 records
    records = list(stream_jsonl(raw_path, max_records=5))
    assert len(records) == 5
    assert "event_id" in records[0]
    assert "timestamp" in records[0]
    assert "severity" in records[0]


def test_data_cleaning_and_derivation():
    """Tests polymorphic record normalization and derived incident proxy rule."""
    sample_raw = {
        "event_id": "test-uuid-001",
        "timestamp": "2025-05-20T14:30:00",
        "event_type": "ids_alert",
        "source": "Microsoft Sentinel v1.0.0",
        "severity": "critical",
        "alert_type": "Zero-Day Exploit",
        "category": "Exploit",
        "dst_ip": "10.0.0.5",
        "advanced_metadata": {
            "risk_score": 85.0,
            "confidence": 0.80,
            "geo_location": "United States"
        },
        "description": "Zero-Day Exploit detected MITRE Technique: T1190"
    }

    cleaned = clean_single_record(sample_raw)
    assert cleaned["alert_id"] == "test-uuid-001"
    assert cleaned["alert_type"] == "Zero-Day Exploit"
    assert cleaned["affected_system"] == "10.0.0.5"
    assert cleaned["mitre_technique"] == "T1190"
    assert cleaned["is_incident"] == 1, "High risk critical alert should be flagged as derived incident"


def test_feature_engineering_pipeline():
    """Validates temporal, repetition, frequency, and burst features."""
    sample_df = pd.DataFrame([
        {
            "alert_id": "a1",
            "timestamp": pd.Timestamp("2025-05-15 03:00:00"),
            "source": "CrowdStrike v6.45.0",
            "alert_type": "Brute Force",
            "affected_system": "srv-01",
            "asset_category": "Target Network Host",
            "severity": "high",
            "severity_num": 3,
            "is_anomaly": True,
            "baseline_deviation": 2.5,
            "entropy": 4.1
        },
        {
            "alert_id": "a2",
            "timestamp": pd.Timestamp("2025-05-15 03:02:00"),
            "source": "CrowdStrike v6.45.0",
            "alert_type": "Brute Force",
            "affected_system": "srv-01",
            "asset_category": "Target Network Host",
            "severity": "high",
            "severity_num": 3,
            "is_anomaly": True,
            "baseline_deviation": 2.8,
            "entropy": 4.2
        }
    ])

    feat_df = engineer_features(sample_df)
    assert "hour" in feat_df.columns
    assert "night_time" in feat_df.columns
    assert feat_df["night_time"].iloc[0] == 1, "03:00 should be night_time"
    assert "alert_burst_score" in feat_df.columns
    assert feat_df["alert_burst_score"].iloc[1] > 0, "Rapid recurrence should trigger alert burst score"


def test_noise_scoring_engine():
    """Verifies that high-repetition low-severity events receive high noise scores, and critical events are never suppressed."""
    test_df = pd.DataFrame([
        {
            "alert_type": "Port Scan",
            "severity": "info",
            "repeated_alert_count": 60,
            "time_since_previous_similar_alert": 45,
            "is_incident": 0,
            "is_anomaly": False
        },
        {
            "alert_type": "Zero-Day Exploit",
            "severity": "critical",
            "repeated_alert_count": 1,
            "time_since_previous_similar_alert": 86400,
            "is_incident": 1,
            "is_anomaly": True
        }
    ])

    scored = calculate_noise_scores(test_df)
    assert scored["noise_score"].iloc[0] >= 65.0, "Frequent info port scan should be High Noise"
    assert scored["noise_level"].iloc[0] == "HIGH"
    assert scored["noise_score"].iloc[1] <= 30.0, "Critical exploit must never be High Noise"
    assert scored["noise_level"].iloc[1] == "LOW"


def test_model_loading_and_prediction():
    """Tests loading serialized Random Forest model and executing live inference."""
    predictor = get_predictor()
    assert predictor.model is not None
    assert len(predictor.feature_names) > 40

    payload = {
        "event_type": "ids_alert",
        "source": "Microsoft Sentinel v1.0.0",
        "severity": "critical",
        "alert_type": "Supply Chain Compromise",
        "category": "Exploit",
        "affected_system": "10.0.1.200",
        "asset_category": "Target Network Host",
        "alert_burst_score": 3.0,
        "is_anomaly": True
    }

    res = predictor.predict_single(payload)
    assert "incident_probability" in res
    assert 0.0 <= res["incident_probability"] <= 1.0
    assert res["priority"] in ["CRITICAL", "HIGH"]
    assert len(res["contributing_features"]) > 0


def test_prioritization_engine():
    """Tests priority score calculations and rule thresholds."""
    crit_res = calculate_priority_score(
        incident_prob=0.88,
        severity="critical",
        asset_category="AI Model Engine",
        burst_score=3.0,
        noise_score=10.0
    )
    assert crit_res["priority_level"] == "CRITICAL"
    assert crit_res["priority_score"] >= 75.0

    low_res = calculate_priority_score(
        incident_prob=0.05,
        severity="info",
        asset_category="Endpoint File/Object",
        burst_score=0.0,
        noise_score=80.0
    )
    assert low_res["priority_level"] == "LOW"
    assert low_res["priority_score"] < 30.0


def test_api_overview_and_alerts(api_client):
    """Tests FastAPI overview, alerts pagination, and filtering."""
    ov_res = api_client.get("/api/overview")
    assert ov_res.status_code == 200
    ov_data = ov_res.json()
    assert ov_data["total_alerts"] == 100000
    assert ov_data["total_incidents"] == 5447

    al_res = api_client.get("/api/alerts?page=1&page_size=10&priority=CRITICAL")
    assert al_res.status_code == 200
    al_data = al_res.json()
    assert len(al_data["items"]) == 10
    assert al_data["total"] > 0


def test_api_insights_and_predict(api_client):
    """Tests dynamic insights and live predict API endpoint."""
    ins_res = api_client.get("/api/insights")
    assert ins_res.status_code == 200
    insights = ins_res.json()
    assert len(insights) >= 5

    payload = {
        "event_type": "cloud",
        "source": "Wazuh v4.5.0",
        "severity": "high",
        "alert_type": "Container Escape",
        "category": "Malware",
        "affected_system": "k8s-prod-cluster",
        "asset_category": "Cloud Resource",
        "alert_burst_score": 2.0,
        "is_anomaly": True
    }
    pred_res = api_client.post("/api/predict", json=payload)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert pred_data["priority"] in ["CRITICAL", "HIGH", "MEDIUM"]
    assert "explanation" in pred_data
