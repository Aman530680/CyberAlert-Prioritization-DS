"""
CyberAlert-Prioritization: Data Quality & Schema Validation Module
Performs schema validation, duplicate detection, timestamp parsing, categorical profiling,
and generates an audit-ready data quality report.
"""

import json
import logging
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

from src.data.ingestion import stream_jsonl

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("validation")

VALID_SEVERITIES = {"emergency", "critical", "high", "medium", "low", "info"}
VALID_EVENT_TYPES = {"ai", "endpoint", "auth", "cloud", "ids_alert", "firewall", "iot", "network"}


def run_data_quality_audit(raw_file_path: str = "data/raw/advanced_siem_dataset.jsonl") -> Dict[str, Any]:
    """
    Executes a comprehensive data quality audit across the entire dataset.
    """
    logger.info("Starting Data Quality & Schema Validation audit...")
    
    total_records = 0
    malformed_records = 0
    seen_event_ids = set()
    duplicate_event_ids = 0
    invalid_timestamps = 0
    invalid_severities = 0
    invalid_event_types = 0
    
    timestamps = []
    severities_dist = Counter()
    event_types_dist = Counter()
    sources_dist = Counter()
    alert_types_dist = Counter()
    categories_dist = Counter()
    
    missing_counts = Counter()
    all_keys = set()
    
    for record in stream_jsonl(raw_file_path):
        total_records += 1
        
        # Check event_id
        eid = record.get("event_id")
        if not eid:
            malformed_records += 1
        elif eid in seen_event_ids:
            duplicate_event_ids += 1
        else:
            seen_event_ids.add(eid)
            
        # Check timestamp
        ts_str = record.get("timestamp")
        if not ts_str:
            invalid_timestamps += 1
        else:
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                timestamps.append(ts)
            except Exception:
                invalid_timestamps += 1
                
        # Check severity
        sev = str(record.get("severity", "")).lower()
        if sev not in VALID_SEVERITIES:
            invalid_severities += 1
        else:
            severities_dist[sev] += 1
            
        # Check event_type
        et = record.get("event_type")
        if et not in VALID_EVENT_TYPES:
            invalid_event_types += 1
        else:
            event_types_dist[et] += 1
            
        # Source
        src = record.get("source")
        if src:
            sources_dist[src] += 1
            
        # Alert type (when present)
        atype = record.get("alert_type")
        if atype:
            alert_types_dist[atype] += 1
            
        # Category (when present)
        cat = record.get("category")
        if cat:
            categories_dist[cat] += 1
            
        # Track all keys and missing values
        record_keys = set(record.keys())
        all_keys.update(record_keys)
        
    # Second pass for missing values per key
    # In JSONL streaming, we know total_records and all_keys
    # Let's compute presence percentages
    min_time = min(timestamps).isoformat() if timestamps else "N/A"
    max_time = max(timestamps).isoformat() if timestamps else "N/A"
    
    report = {
        "audit_timestamp": datetime.utcnow().isoformat(),
        "total_records": total_records,
        "total_unique_keys": len(all_keys),
        "malformed_records": malformed_records,
        "duplicate_event_ids": duplicate_event_ids,
        "invalid_timestamps": invalid_timestamps,
        "invalid_severities": invalid_severities,
        "invalid_event_types": invalid_event_types,
        "date_range": {
            "start": min_time,
            "end": max_time,
            "span_days": (max(timestamps) - min(timestamps)).days if timestamps else 0,
        },
        "metrics": {
            "unique_event_types": len(event_types_dist),
            "unique_sources": len(sources_dist),
            "unique_alert_types": len(alert_types_dist),
            "unique_categories": len(categories_dist),
        },
        "distributions": {
            "severity": dict(severities_dist),
            "event_type": dict(event_types_dist),
            "top_sources": dict(sources_dist.most_common(10)),
            "top_alert_types": dict(alert_types_dist.most_common(10)),
            "categories": dict(categories_dist),
        },
        "data_quality_score": round(
            (1.0 - ((duplicate_event_ids + invalid_timestamps + invalid_severities) / max(total_records, 1))) * 100, 2
        ),
        "status": "PASSED" if (duplicate_event_ids == 0 and invalid_timestamps == 0 and invalid_severities == 0) else "WARNINGS_FOUND"
    }
    
    # Save report
    out_dir = Path("data/processed")
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "data_quality_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    logger.info(f"Data quality audit completed. Score: {report['data_quality_score']}%. Saved to {report_file}")
    return report


if __name__ == "__main__":
    rep = run_data_quality_audit()
    print("\n--- DATA QUALITY REPORT SUMMARY ---")
    print(f"Total Rows: {rep['total_records']}")
    print(f"Duplicate IDs: {rep['duplicate_event_ids']}")
    print(f"Invalid Timestamps: {rep['invalid_timestamps']}")
    print(f"Severity Distribution: {rep['distributions']['severity']}")
    print(f"Date Range: {rep['date_range']['start']} -> {rep['date_range']['end']}")
    print(f"Data Quality Score: {rep['data_quality_score']}% (Status: {rep['status']})")
