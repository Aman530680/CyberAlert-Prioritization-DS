"""
CyberAlert-Prioritization: Machine Learning & Incident Intelligence Routes
"""

import json
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database.session import get_db

router = APIRouter(tags=["Machine Learning & Incidents"])


@router.get("/model/metrics")
def get_model_metrics(db: Session = Depends(get_db)):
    """Returns Random Forest model performance metrics, confusion matrix, ROC-AUC, and curves."""
    eval_path = Path("models/evaluation_report.json")
    if eval_path.exists():
        with open(eval_path, "r", encoding="utf-8") as f:
            return json.load(f)

    meta_path = Path("models/model_metadata.json")
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)

    # Fallback to MySQL model_runs table
    row = db.execute(text("SELECT * FROM model_runs ORDER BY id DESC LIMIT 1;")).mappings().first()
    if row:
        return dict(row)

    return {"message": "Model evaluation report unavailable."}


@router.get("/model/features")
def get_model_features():
    """Returns global Random Forest feature importance rankings."""
    meta_path = Path("models/model_metadata.json")
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            m = json.load(f)
            return m.get("top_features", [])
    return []


@router.get("/priorities")
def get_priorities(db: Session = Depends(get_db)):
    """Returns priority tier distribution and average probability."""
    query = text("""
        SELECT 
            priority,
            COUNT(*) as count,
            ROUND(AVG(incident_probability) * 100, 2) as avg_incident_prob,
            ROUND(AVG(noise_score), 2) as avg_noise_score
        FROM alerts
        GROUP BY priority
        ORDER BY FIELD(priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
    """)
    rows = db.execute(query).mappings().all()
    total = sum(r["count"] for r in rows)
    return [
        {
            "priority": r["priority"],
            "count": int(r["count"]),
            "percentage": round((r["count"] / max(total, 1)) * 100, 2),
            "avg_incident_probability": float(r["avg_incident_prob"] or 0.0),
            "avg_noise_score": float(r["avg_noise_score"] or 0.0)
        }
        for r in rows
    ]


@router.get("/incidents")
def get_incidents_overview(db: Session = Depends(get_db)):
    """Returns incident summary statistics and high-risk vectors."""
    query = text("""
        SELECT 
            COUNT(*) as total_alerts,
            SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) as confirmed_incidents,
            ROUND((SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as incident_rate,
            SUM(CASE WHEN severity = 'emergency' AND is_incident = 1 THEN 1 ELSE 0 END) as emergency_incidents,
            SUM(CASE WHEN severity = 'critical' AND is_incident = 1 THEN 1 ELSE 0 END) as critical_incidents
        FROM alerts;
    """)
    res = db.execute(query).mappings().first()
    return dict(res)
