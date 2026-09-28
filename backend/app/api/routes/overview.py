"""
CyberAlert-Prioritization: Overview & Metadata API Endpoints
"""

import json
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.repositories.alert_repo import AlertRepository
from backend.app.schemas.alert import OverviewResponse, FilterOptionsResponse

router = APIRouter(tags=["Overview"])


@router.get("/overview", response_model=OverviewResponse)
def get_overview(db: Session = Depends(get_db)):
    """Returns top-level SOC KPI metrics, incident rate, and data quality indicators."""
    stats = AlertRepository.get_overview_stats(db)
    
    # Load ML metrics and data quality scores from artifacts
    model_acc = 92.16
    model_auc = 0.8018
    meta_path = Path("models/model_metadata.json")
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            m = json.load(f)
            model_acc = round(m["metrics"]["test_accuracy"] * 100, 2)
            model_auc = round(m["metrics"]["roc_auc"], 4)

    dq_score = 100.0
    dq_path = Path("data/processed/data_quality_report.json")
    if dq_path.exists():
        with open(dq_path, "r", encoding="utf-8") as f:
            dq = json.load(f)
            dq_score = dq.get("data_quality_score", 100.0)

    return {
        "total_alerts": stats["total_alerts"],
        "total_incidents": stats["total_incidents"],
        "incident_rate": stats["incident_rate"],
        "critical_alerts": stats["critical_alerts"],
        "high_priority_alerts": stats["high_priority_alerts"],
        "high_noise_alerts": stats["high_noise_alerts"],
        "model_accuracy": model_acc,
        "model_roc_auc": model_auc,
        "data_quality_score": dq_score,
        "date_range_start": stats["date_range_start"],
        "date_range_end": stats["date_range_end"]
    }


@router.get("/filters", response_model=FilterOptionsResponse)
def get_filters(db: Session = Depends(get_db)):
    """Returns distinct filter options for dashboard dropdowns."""
    return AlertRepository.get_filter_options(db)
