"""
CyberAlert-Prioritization: Explainable Noise Detection & Scoring Engine
Calculates multi-signal Noise Score without falsely equating 'Repeated == Noise'.
Provides rule tuning recommendations while preserving security visibility.
"""

import logging
from typing import Dict, Any
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("noise_analysis")


def calculate_noise_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes explainable composite Noise Scores [0.0 - 100.0] and categorizes alerts.
    
    Formula signals:
    1. Low Severity Factor (25%): Info/Low severities contribute strongly to noise.
    2. Repetition Factor (25%): Log-scaled repetition frequency of the (source, type, system) triplet.
    3. Short Recurrence Factor (15%): Recurrence interval under 60-300 seconds without escalation.
    4. Non-Incident Association (25%): Alert types with historically low incident conversion.
    5. Clean Baseline Factor (10%): Absence of behavioral anomalies.
    """
    logger.info(f"Computing explainable noise scores for {len(df)} records...")
    df = df.copy()
    
    # 1. Low Severity Factor (0.0 to 1.0)
    sev_noise_map = {
        "info": 1.0,
        "low": 0.8,
        "medium": 0.45,
        "high": 0.15,
        "critical": 0.02,
        "emergency": 0.0
    }
    s_sev = df["severity"].str.lower().map(sev_noise_map).fillna(0.5)
    
    # 2. Repetition Factor (0.0 to 1.0)
    rep_count = df["repeated_alert_count"] if "repeated_alert_count" in df.columns else 1
    s_rep = np.clip(np.log1p(rep_count) / np.log1p(50), 0.0, 1.0)
    
    # 3. Short Recurrence Factor (0.0 to 1.0)
    time_since = df["time_since_previous_similar_alert"] if "time_since_previous_similar_alert" in df.columns else 86400
    s_rec = np.where(time_since <= 120, 1.0, np.where(time_since <= 600, 0.6, np.where(time_since <= 3600, 0.3, 0.0)))
    
    # 4. Historical Non-Incident Association (0.0 to 1.0)
    if "is_incident" in df.columns:
        type_incident_rate = df.groupby("alert_type")["is_incident"].transform("mean")
        s_non_inc = 1.0 - type_incident_rate
    else:
        s_non_inc = 0.5
        
    # 5. Clean Baseline Factor (0.0 to 1.0)
    is_anom = df["is_anomaly"] if "is_anomaly" in df.columns else False
    s_clean = np.where(is_anom, 0.0, 1.0)
    
    # Composite Noise Score (0 - 100)
    raw_noise = (
        0.25 * s_sev +
        0.25 * s_rep +
        0.15 * s_rec +
        0.25 * s_non_inc +
        0.10 * s_clean
    )
    
    # Severe safety constraint: Critical or Emergency can NEVER be High Noise
    crit_mask = df["severity"].str.lower().isin(["critical", "emergency"])
    raw_noise = np.where(crit_mask, np.minimum(raw_noise, 0.30), raw_noise)
    
    df["noise_score"] = np.round(raw_noise * 100.0, 2)
    
    # Noise Tier
    df["noise_level"] = np.where(
        df["noise_score"] >= 65.0,
        "HIGH",
        np.where(df["noise_score"] >= 35.0, "MEDIUM", "LOW")
    )
    
    # Tuning Recommendation Reason
    df["noise_reason"] = np.where(
        df["noise_level"] == "HIGH",
        "High volume repetitive low-severity alert with low historical incident correlation. Recommended for SIEM aggregation tuning.",
        np.where(
            df["noise_level"] == "MEDIUM",
            "Moderate repetition with routine activity. Retain standard triage queue.",
            "High fidelity security telemetry. Immediate investigation required."
        )
    )
    
    logger.info(f"Noise calculation complete. Distribution: {df['noise_level'].value_counts().to_dict()}")
    return df


if __name__ == "__main__":
    test_df = pd.DataFrame([
        {"alert_type": "Port Scan", "severity": "info", "repeated_alert_count": 80, "time_since_previous_similar_alert": 30, "is_incident": 0, "is_anomaly": False},
        {"alert_type": "Zero-Day Exploit", "severity": "critical", "repeated_alert_count": 1, "time_since_previous_similar_alert": 86400, "is_incident": 1, "is_anomaly": True},
    ])
    res = calculate_noise_scores(test_df)
    print(res[["alert_type", "severity", "noise_score", "noise_level", "noise_reason"]])
