"""
CyberAlert-Prioritization: Backend API Verification Suite
Tests all FastAPI endpoints using FastAPI TestClient to ensure 100% functionality before running servers.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    print("[PASS] Health check passed")


def test_overview():
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_alerts"] == 100000
    assert data["total_incidents"] > 0
    print(f"[PASS] Overview passed: Total Alerts={data['total_alerts']}, Incidents={data['total_incidents']} ({data['incident_rate']}%)")


def test_filters():
    res = client.get("/api/filters")
    assert res.status_code == 200
    data = res.json()
    assert len(data["severities"]) > 0
    assert len(data["priorities"]) == 4
    print(f"[PASS] Filters passed: {len(data['alert_types'])} alert types, {len(data['sources'])} sources")


def test_alerts_pagination():
    res = client.get("/api/alerts?page=1&page_size=5&priority=CRITICAL")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 5
    assert data["total"] > 0
    sample_alert_id = data["items"][0]["alert_id"]
    print(f"[PASS] Paginated alerts passed: {data['total']} critical alerts found. Sample: {sample_alert_id}")
    return sample_alert_id


def test_alert_detail(alert_id: str):
    res = client.get(f"/api/alerts/{alert_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["alert_id"] == alert_id
    assert "explanation" in data
    assert "top_contributing_features" in data
    print(f"[PASS] Alert detail passed: Alert ID={alert_id}, Explanation='{data['explanation'][:60]}...'")


def test_trends_and_types():
    t_res = client.get("/api/alerts/trends")
    assert t_res.status_code == 200
    types_res = client.get("/api/alerts/types?top_n=5")
    assert types_res.status_code == 200
    assert len(types_res.json()) == 5
    print("[PASS] Trends and Alert Types analytics passed")


def test_severity_and_noise():
    s_res = client.get("/api/alerts/severity")
    assert s_res.status_code == 200
    n_res = client.get("/api/alerts/noise")
    assert n_res.status_code == 200
    print("[PASS] Severity and Noise analytics passed")


def test_model_endpoints():
    m_res = client.get("/api/model/metrics")
    assert m_res.status_code == 200
    f_res = client.get("/api/model/features")
    assert f_res.status_code == 200
    p_res = client.get("/api/priorities")
    assert p_res.status_code == 200
    print(f"[PASS] Model metrics and features passed: {len(f_res.json())} features loaded")


def test_insights_and_action_plan():
    ins_res = client.get("/api/insights")
    assert ins_res.status_code == 200
    insights = ins_res.json()
    assert len(insights) >= 5
    plan_res = client.get("/api/action-plan")
    assert plan_res.status_code == 200
    print(f"[PASS] Insights & Action Plan passed: {len(insights)} dynamic empirical findings generated")


def test_predict_endpoint():
    payload = {
        "event_type": "ids_alert",
        "source": "Microsoft Sentinel v1.0.0",
        "severity": "critical",
        "alert_type": "Zero-Day Exploit",
        "category": "Exploit",
        "affected_system": "192.168.1.55",
        "alert_burst_score": 3.0,
        "is_anomaly": True
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "incident_probability" in data
    assert data["priority"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert "explanation" in data
    assert len(data["contributing_features"]) > 0
    print(f"[PASS] Predict API passed: Probability={data['incident_probability']}, Priority={data['priority']}, Reason='{data['explanation'][:60]}...'")


if __name__ == "__main__":
    print("\n--- RUNNING BACKEND INTEGRATION TESTS ---")
    test_health()
    test_overview()
    test_filters()
    sample_id = test_alerts_pagination()
    test_alert_detail(sample_id)
    test_trends_and_types()
    test_severity_and_noise()
    test_model_endpoints()
    test_insights_and_action_plan()
    test_predict_endpoint()
    print("\nALL 10 BACKEND ENDPOINTS VALIDATED SUCCESSFULLY!\n")
