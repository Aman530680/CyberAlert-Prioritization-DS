"""
CyberAlert-Prioritization: SOC Alert Prioritization Engine
Combines ML incident likelihood, asset sensitivity, severity weights, and burst velocity
to compute an explainable Alert Priority Score [0 - 100] and triage tier (CRITICAL, HIGH, MEDIUM, LOW).
"""

import logging
from typing import Dict, Any, List
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("prioritization")

ASSET_RISK_MAP = {
    "AI Model Engine": 0.95,
    "Cloud Resource": 0.90,
    "Core Infrastructure": 0.90,
    "Target Network Host": 0.80,
    "IoT Hardware": 0.70,
    "User Identity": 0.65,
    "Endpoint File/Object": 0.50,
    "Source IP Node": 0.40
}

SEVERITY_SCORE_MAP = {
    "emergency": 1.0,
    "critical": 0.85,
    "high": 0.55,
    "medium": 0.25,
    "low": 0.10,
    "info": 0.02
}


def calculate_priority_score(
    incident_prob: float,
    severity: str,
    asset_category: str = "Target Network Host",
    burst_score: float = 0.0,
    noise_score: float = 0.0
) -> Dict[str, Any]:
    """
    Computes explainable composite Priority Score [0 - 100], priority level, and reason list.
    """
    sev_factor = SEVERITY_SCORE_MAP.get(str(severity).lower(), 0.25)
    asset_factor = ASSET_RISK_MAP.get(str(asset_category), 0.60)
    burst_factor = min(1.0, float(burst_score) / 3.0)
    
    # Base weighted sum:
    # 40% ML Probability + 30% Severity + 15% Asset Risk + 15% Burst Velocity
    raw_score = (
        0.40 * float(incident_prob) +
        0.30 * sev_factor +
        0.15 * asset_factor +
        0.15 * burst_factor
    ) * 100.0
    
    # Noise penalty discount (applied only to non-critical alerts)
    reasons = []
    if str(severity).lower() in ["critical", "emergency"]:
        # Safety guarantee: Never heavily penalize high severity
        reasons.append(f"High-impact severity level: {severity.upper()}")
    else:
        if noise_score >= 65.0:
            raw_score -= 20.0
            reasons.append(f"High noise score ({noise_score}%) reduced priority score")
            
    final_score = round(max(0.0, min(100.0, raw_score)), 2)
    
    # Priority Level Mapping
    if final_score >= 75.0 or (sev_factor >= 0.85 and float(incident_prob) >= 0.60):
        priority_level = "CRITICAL"
        reasons.append("Critical threat escalation threshold exceeded; immediate response required")
    elif final_score >= 50.0:
        priority_level = "HIGH"
        reasons.append("High probability incident candidate requiring Tier-2 investigation")
    elif final_score >= 25.0:
        priority_level = "MEDIUM"
        reasons.append("Standard operational alert queue")
    else:
        priority_level = "LOW"
        reasons.append("Routine telemetry with low incident conversion likelihood")
        
    if incident_prob >= 0.50:
        reasons.append(f"Model estimated elevated incident likelihood: {round(incident_prob * 100, 1)}%")
    if burst_score >= 2.0:
        reasons.append("Coordinated alert burst detected")
        
    return {
        "priority_score": final_score,
        "priority_level": priority_level,
        "reasons": reasons,
        "reason_summary": " | ".join(reasons)
    }


def prioritize_dataframe(df: pd.DataFrame, prob_col: str = "incident_probability") -> pd.DataFrame:
    """
    Applies the prioritization engine across an entire DataFrame of alerts.
    """
    logger.info(f"Prioritizing {len(df)} alert records...")
    df = df.copy()
    
    priorities = []
    priority_scores = []
    priority_reasons = []
    
    for _, row in df.iterrows():
        p_res = calculate_priority_score(
            incident_prob=float(row.get(prob_col, 0.0)),
            severity=str(row.get("severity", "medium")),
            asset_category=str(row.get("asset_category", "Target Network Host")),
            burst_score=float(row.get("alert_burst_score", 0.0)),
            noise_score=float(row.get("noise_score", 0.0))
        )
        priorities.append(p_res["priority_level"])
        priority_scores.append(p_res["priority_score"])
        priority_reasons.append(p_res["reason_summary"])
        
    df["priority"] = priorities
    df["priority_score"] = priority_scores
    df["priority_reason"] = priority_reasons
    
    logger.info(f"Prioritization complete. Distribution: {df['priority'].value_counts().to_dict()}")
    return df


if __name__ == "__main__":
    res = calculate_priority_score(0.85, "critical", "AI Model Engine", burst_score=3.0, noise_score=10.0)
    print("Prioritization test:", res)
