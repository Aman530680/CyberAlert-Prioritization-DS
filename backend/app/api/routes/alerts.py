"""
CyberAlert-Prioritization: Alert Data & Analytics Routes
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.repositories.alert_repo import AlertRepository
from backend.app.schemas.alert import PaginatedAlertsResponse, AlertDetailResponse
from src.explainability.shap_analysis import ModelExplainer

router = APIRouter(prefix="/alerts", tags=["Alerts"])
explainer = None


def get_explainer():
    global explainer
    if explainer is None:
        try:
            explainer = ModelExplainer()
        except Exception:
            explainer = None
    return explainer


@router.get("", response_model=PaginatedAlertsResponse)
def get_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    severity: Optional[str] = None,
    priority: Optional[str] = None,
    alert_type: Optional[str] = None,
    source: Optional[str] = None,
    affected_system: Optional[str] = None,
    noise_level: Optional[str] = None,
    is_incident: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns paginated, searchable, and filtered list of alerts."""
    return AlertRepository.get_paginated_alerts(
        db=db,
        page=page,
        page_size=page_size,
        severity=severity,
        priority=priority,
        alert_type=alert_type,
        source=source,
        affected_system=affected_system,
        noise_level=noise_level,
        is_incident=is_incident,
        date_from=date_from,
        date_to=date_to,
        search=search
    )


@router.get("/trends")
def get_alert_trends(db: Session = Depends(get_db)):
    """Returns volume over time, hourly distributions, and priority breakdowns."""
    return AlertRepository.get_alert_trends(db)


@router.get("/types")
def get_alert_types(top_n: int = Query(15, ge=5, le=50), db: Session = Depends(get_db)):
    """Returns most common alert types with incident rates and noise metrics."""
    return AlertRepository.get_alert_types_analysis(db, top_n=top_n)


@router.get("/severity")
def get_severity_breakdown(db: Session = Depends(get_db)):
    """Returns severity distribution and incident conversion rates."""
    return AlertRepository.get_severity_analysis(db)


@router.get("/sources")
def get_sources_breakdown(top_n: int = Query(15, ge=5, le=50), db: Session = Depends(get_db)):
    """Returns detection source breakdown and noise volumes."""
    return AlertRepository.get_source_analysis(db, top_n=top_n)


@router.get("/systems")
def get_systems_breakdown(top_n: int = Query(15, ge=5, le=50), db: Session = Depends(get_db)):
    """Returns top affected systems and asset risk metrics."""
    return AlertRepository.get_system_intelligence(db, top_n=top_n)


@router.get("/noise")
def get_noise_analysis(db: Session = Depends(get_db)):
    """Returns noise score distributions and top tuning candidate rules."""
    return AlertRepository.get_noise_analysis_summary(db)


@router.get("/{alert_id}", response_model=AlertDetailResponse)
def get_alert_detail(alert_id: str, db: Session = Depends(get_db)):
    """Returns full alert details, historical repetition, and SHAP local feature contributions."""
    row = AlertRepository.get_alert_by_id(db, alert_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Alert with ID '{alert_id}' not found.")

    exp = get_explainer()
    explanation_summary = "Standard telemetry observation."
    top_contribs = []

    if exp:
        exp_res = exp.explain_instance(row, top_n=5)
        explanation_summary = exp_res["explanation_summary"]
        top_contribs = exp_res["top_contributing_features"]

    # Historical incident rate for this alert type
    type_stats = AlertRepository.get_alert_types_analysis(db, top_n=50)
    match_stat = next((t for t in type_stats if t["alert_type"] == row["alert_type"]), None)
    hist_rate = match_stat["incident_rate"] if match_stat else 5.0

    features = {
        "hour": row.get("hour"),
        "business_hours": row.get("business_hours"),
        "repeated_alert_count": row.get("repeated_alert_count", 1),
        "alert_burst_score": row.get("alert_burst_score", 0.0),
        "time_since_previous_similar_alert": row.get("time_since_previous_similar_alert", 86400),
        "source_alert_frequency": row.get("source_alert_frequency", 0.0),
        "system_alert_frequency": row.get("system_alert_frequency", 0.0)
    }

    return {
        **row,
        "features": features,
        "explanation": explanation_summary,
        "top_contributing_features": top_contribs,
        "related_alerts_count": row.get("repeated_alert_count", 1),
        "historical_incident_rate": hist_rate
    }
