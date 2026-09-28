"""
CyberAlert-Prioritization: Incident Correlation & Association Analysis Module
Computes empirical incident escalation rates across alert types, severities, sources, and systems.
"""

import logging
from typing import Dict, Any, List
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("incident_analysis")


def get_incident_rate_by_alert_type(df: pd.DataFrame, top_n: int = 15) -> List[Dict[str, Any]]:
    """Calculates incident volume and conversion rate by alert type."""
    grouped = df.groupby("alert_type").agg(
        total_alerts=("alert_id", "count"),
        incident_count=("is_incident", "sum")
    ).reset_index()
    grouped["incident_rate"] = np.round((grouped["incident_count"] / grouped["total_alerts"]) * 100, 2)
    # Sort by incident_rate descending, then total_alerts
    grouped.sort_values(by=["incident_rate", "total_alerts"], ascending=False, inplace=True)
    return grouped.head(top_n).to_dict(orient="records")


def get_incident_rate_by_severity(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Calculates incident rate across severity levels."""
    sev_order = ["emergency", "critical", "high", "medium", "low", "info"]
    grouped = df.groupby("severity").agg(
        total_alerts=("alert_id", "count"),
        incident_count=("is_incident", "sum")
    ).reset_index()
    grouped["incident_rate"] = np.round((grouped["incident_count"] / grouped["total_alerts"]) * 100, 2)
    
    # Reorder according to standard severity hierarchy
    res = []
    lookup = {r["severity"].lower(): r for r in grouped.to_dict(orient="records")}
    for s in sev_order:
        if s in lookup:
            res.append(lookup[s])
    return res


def get_incident_rate_by_source(df: pd.DataFrame, top_n: int = 10) -> List[Dict[str, Any]]:
    """Calculates incident rate across SIEM and EDR detection sources."""
    grouped = df.groupby("source").agg(
        total_alerts=("alert_id", "count"),
        incident_count=("is_incident", "sum")
    ).reset_index()
    grouped["incident_rate"] = np.round((grouped["incident_count"] / grouped["total_alerts"]) * 100, 2)
    grouped.sort_values(by="total_alerts", ascending=False, inplace=True)
    return grouped.head(top_n).to_dict(orient="records")


def get_incident_rate_by_system(df: pd.DataFrame, top_n: int = 10) -> List[Dict[str, Any]]:
    """Calculates incident rate across affected systems."""
    grouped = df.groupby(["affected_system", "asset_category"]).agg(
        total_alerts=("alert_id", "count"),
        incident_count=("is_incident", "sum")
    ).reset_index()
    grouped["incident_rate"] = np.round((grouped["incident_count"] / grouped["total_alerts"]) * 100, 2)
    grouped.sort_values(by=["incident_count", "total_alerts"], ascending=False, inplace=True)
    return grouped.head(top_n).to_dict(orient="records")


def get_incident_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """Generates top-level incident intelligence overview."""
    total_alerts = len(df)
    total_incidents = int(df["is_incident"].sum())
    incident_rate = round((total_incidents / total_alerts) * 100, 2) if total_alerts > 0 else 0.0
    critical_alerts = int(df["severity"].str.lower().isin(["critical", "emergency"]).sum())
    
    return {
        "total_alerts": total_alerts,
        "total_incidents": total_incidents,
        "incident_rate_pct": incident_rate,
        "critical_alert_count": critical_alerts,
        "high_priority_candidates": int((df["is_incident"] == 1) | (df["severity"].str.lower() == "critical")).sum()
    }
