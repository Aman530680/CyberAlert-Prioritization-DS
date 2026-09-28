"""
CyberAlert-Prioritization: Data Cleaning & Normalization Pipeline
Transforms polymorphic SIEM logs into a clean, normalized, tabular structure.
Calculates the defensible derived incident target and standardizes asset identities.
"""

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
import numpy as np

from src.data.ingestion import stream_jsonl

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cleaning")

SEVERITY_WEIGHT_MAP = {
    "info": 0,
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
    "emergency": 5,
}

MITRE_PATTERN = re.compile(r"T\d{4}(?:\.\d{3})?")


def clean_single_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes a single polymorphic SIEM JSON record into a standardized tabular row.
    """
    # 1. Base Identifiers
    alert_id = record.get("event_id")
    raw_ts = record.get("timestamp")
    try:
        dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
    except Exception:
        dt = datetime.now(timezone.utc)
        
    event_type = record.get("event_type", "unknown")
    source = record.get("source", "Unknown SIEM")
    severity = str(record.get("severity", "medium")).lower()
    sev_weight = SEVERITY_WEIGHT_MAP.get(severity, 2)
    
    # 2. Alert Type Normalization
    raw_alert_type = record.get("alert_type")
    raw_action = record.get("action")
    if raw_alert_type:
        alert_type = raw_alert_type.strip()
    elif raw_action:
        alert_type = raw_action.replace("_", " ").title()
    else:
        alert_type = f"{event_type.title()} Event"
        
    # 3. Category Normalization
    category = record.get("category")
    if not category:
        category_map = {
            "auth": "Authentication",
            "cloud": "Cloud Security",
            "endpoint": "Endpoint Activity",
            "ai": "AI Safety",
            "firewall": "Network Defense",
            "iot": "IoT Telemetry",
            "network": "Network Traffic",
            "ids_alert": "Intrusion Detection"
        }
        category = category_map.get(event_type, "General Telemetry")
        
    # 4. Affected System & Asset Category Resolution
    dst_ip = record.get("dst_ip")
    src_ip = record.get("src_ip")
    resource_id = record.get("resource_id")
    device_id = record.get("device_id")
    model_id = record.get("model_id")
    obj = record.get("object")
    user = record.get("user")
    
    if dst_ip and dst_ip != "N/A":
        affected_system = dst_ip
        asset_category = "Target Network Host"
    elif resource_id:
        affected_system = resource_id
        asset_category = "Cloud Resource"
    elif device_id:
        affected_system = device_id
        asset_category = "IoT Hardware"
    elif model_id:
        affected_system = model_id
        asset_category = "AI Model Engine"
    elif obj:
        affected_system = obj.split("/")[-1] if "/" in str(obj) else str(obj)
        asset_category = "Endpoint File/Object"
    elif src_ip and src_ip != "N/A":
        affected_system = src_ip
        asset_category = "Source IP Node"
    elif user:
        affected_system = f"usr-{user}"
        asset_category = "User Identity"
    else:
        affected_system = "srv-core-infrastructure"
        asset_category = "Core Infrastructure"
        
    # 5. Advanced Metadata Extraction
    adv_meta = record.get("advanced_metadata", {})
    risk_score = float(adv_meta.get("risk_score", 50.0))
    confidence = float(adv_meta.get("confidence", 0.5))
    geo_location = adv_meta.get("geo_location", "Unknown")
    device_hash = adv_meta.get("device_hash", "")
    session_id = adv_meta.get("session_id", "")
    
    # 6. Behavioral Analytics & Anomalies
    beh_analytics = record.get("behavioral_analytics", {})
    freq_anom = bool(beh_analytics.get("frequency_anomaly", False))
    seq_anom = bool(beh_analytics.get("sequence_anomaly", False))
    baseline_dev = float(beh_analytics.get("baseline_deviation", 0.0))
    entropy = float(beh_analytics.get("entropy", 0.0))
    is_anomaly = bool(freq_anom or seq_anom or baseline_dev >= 2.0)
    
    # 7. MITRE ATT&CK Extraction
    desc = record.get("description") or ""
    raw_log = record.get("raw_log") or ""
    mitre_matches = MITRE_PATTERN.findall(desc) or MITRE_PATTERN.findall(raw_log)
    mitre_technique = mitre_matches[0] if mitre_matches else "None"
    
    # 8. Defensible Ground-Truth Derived Incident Target
    # Multi-factor SOC escalation criteria:
    is_incident = int(
        (severity in ["critical", "emergency"] and risk_score >= 65 and confidence >= 0.55) or
        (severity == "emergency" and risk_score >= 50) or
        (risk_score >= 80 and confidence >= 0.75) or
        (freq_anom and seq_anom and severity in ["high", "critical", "emergency"]) or
        (alert_type in ["Zero-Day Exploit", "Supply Chain Compromise"] and severity in ["critical", "emergency"] and risk_score >= 55)
    )
    
    return {
        "alert_id": alert_id,
        "timestamp": dt,
        "event_type": event_type,
        "source": source,
        "severity": severity,
        "severity_num": sev_weight,
        "alert_type": alert_type,
        "category": category,
        "affected_system": affected_system,
        "asset_category": asset_category,
        "user": user if user else "N/A",
        "src_ip": src_ip if src_ip else "N/A",
        "dst_ip": dst_ip if dst_ip else "N/A",
        "risk_score": risk_score,
        "confidence": confidence,
        "geo_location": geo_location,
        "device_hash": device_hash,
        "session_id": session_id,
        "is_anomaly": is_anomaly,
        "baseline_deviation": baseline_dev,
        "entropy": entropy,
        "mitre_technique": mitre_technique,
        "raw_log": raw_log[:500],
        "description": desc[:500],
        "resolution_status": "Open",
        "incident_status": "Incident" if is_incident == 1 else "Benign Alert",
        "is_incident": is_incident
    }


def process_dataset(
    raw_file_path: str = "data/raw/advanced_siem_dataset.jsonl",
    output_parquet: str = "data/processed/cleaned_alerts.parquet",
    output_csv: str | None = "data/processed/cleaned_alerts.csv",
    batch_size: int = 10000,
    max_records: int | None = None
) -> pd.DataFrame:
    """
    Streams raw JSONL, cleans records in batches, and saves to high-performance Parquet format.
    """
    logger.info(f"Starting dataset cleaning pipeline from: {raw_file_path}")
    
    rows = []
    total_processed = 0
    
    for record in stream_jsonl(raw_file_path, max_records=max_records):
        cleaned = clean_single_record(record)
        rows.append(cleaned)
        total_processed += 1
        
        if total_processed % 25000 == 0:
            logger.info(f"Processed {total_processed} records...")
            
    df = pd.DataFrame(rows)
    
    # Sort chronologically
    df.sort_values(by="timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)
    
    # Save parquet
    p_path = Path(output_parquet)
    p_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(p_path, index=False, engine="pyarrow")
    logger.info(f"Saved {len(df)} cleaned records to {p_path.resolve()} ({p_path.stat().st_size / (1024*1024):.2f} MB)")
    
    if output_csv:
        c_path = Path(output_csv)
        # Save sample/full CSV
        df.to_csv(c_path, index=False)
        logger.info(f"Saved CSV version to {c_path.resolve()}")
        
    logger.info(f"Incident distribution: {df['is_incident'].value_counts().to_dict()} ({df['is_incident'].mean()*100:.2f}%)")
    return df


if __name__ == "__main__":
    df_clean = process_dataset(max_records=5000)
    print("Cleaned sample dataframe shape:", df_clean.shape)
    print(df_clean[["alert_id", "timestamp", "severity", "alert_type", "affected_system", "is_incident"]].head())
