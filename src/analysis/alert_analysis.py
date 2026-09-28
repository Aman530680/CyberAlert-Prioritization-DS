"""
CyberAlert-Prioritization: Alert Analysis & Operational Intelligence Module
Computes empirical alert distributions, temporal patterns, entity frequencies, and burst rates.
Zero hardcoded values.
"""

import logging
from typing import Dict, Any, List
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("alert_analysis")


def get_most_common_alert_types(df: pd.DataFrame, top_n: int = 10) -> List[Dict[str, Any]]:
    """Returns top N most frequent alert types with counts and percentages."""
    counts = df["alert_type"].value_counts().head(top_n)
    total = len(df)
    return [
        {"alert_type": at, "count": int(c), "percentage": round((c / total) * 100, 2)}
        for at, c in counts.items()
    ]


def get_alert_volume_over_time(df: pd.DataFrame, freq: str = "D") -> List[Dict[str, Any]]:
    """Returns alert volume aggregated chronologically by time interval (e.g. Daily 'D' or Hourly 'H')."""
    df_temp = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df_temp["timestamp"]):
        df_temp["timestamp"] = pd.to_datetime(df_temp["timestamp"])
    
    grouped = df_temp.set_index("timestamp").resample(freq).size()
    return [
        {"date": ts.strftime("%Y-%m-%d" if freq == "D" else "%Y-%m-%d %H:%M"), "count": int(count)}
        for ts, count in grouped.items()
        if count > 0
    ]


def get_alerts_by_hour(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Returns 24-hour diurnal alert distribution."""
    if "hour" not in df.columns:
        df["hour"] = pd.to_datetime(df["timestamp"]).dt.hour
    hourly = df["hour"].value_counts().sort_index()
    return [{"hour": int(h), "count": int(hourly.get(h, 0))} for h in range(24)]


def get_alerts_by_severity(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Returns severity distribution counts and percentages."""
    sev_order = ["emergency", "critical", "high", "medium", "low", "info"]
    counts = df["severity"].str.lower().value_counts()
    total = len(df)
    return [
        {
            "severity": s,
            "count": int(counts.get(s, 0)),
            "percentage": round((counts.get(s, 0) / total) * 100, 2)
        }
        for s in sev_order if s in counts
    ]


def get_top_affected_systems(df: pd.DataFrame, top_n: int = 10) -> List[Dict[str, Any]]:
    """Returns top affected systems by alert volume."""
    counts = df["affected_system"].value_counts().head(top_n)
    total = len(df)
    return [
        {"affected_system": str(sys), "count": int(c), "percentage": round((c / total) * 100, 2)}
        for sys, c in counts.items()
    ]


def get_top_sources(df: pd.DataFrame, top_n: int = 10) -> List[Dict[str, Any]]:
    """Returns top SIEM/EDR detection sources."""
    counts = df["source"].value_counts().head(top_n)
    total = len(df)
    return [
        {"source": src, "count": int(c), "percentage": round((c / total) * 100, 2)}
        for src, c in counts.items()
    ]


def get_top_repeated_alerts(df: pd.DataFrame, top_n: int = 10) -> List[Dict[str, Any]]:
    """Returns highest repetition alert signatures (source + type + system)."""
    grouped = df.groupby(["source", "alert_type", "affected_system"]).size().reset_index(name="repetition_count")
    grouped.sort_values(by="repetition_count", ascending=False, inplace=True)
    return grouped.head(top_n).to_dict(orient="records")
