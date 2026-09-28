"""
CyberAlert-Prioritization: High-Performance MySQL Bulk Ingestion Script
Inserts 100,000 processed alerts and feature vectors into MySQL using batch parameterization.
Ensures zero duplicates, logs progress milestones, and records the data quality audit.
"""

import os
import sys
import json
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
import pymysql
import pandas as pd

# Load environment
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("load_dataset")

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "cyberalert_db")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")


def get_db_connection():
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset="utf8mb4",
        autocommit=False
    )


def load_data_quality_report_into_db(report_path: str = "data/processed/data_quality_report.json"):
    """Inserts the data quality audit results into data_quality_reports table."""
    p = Path(report_path)
    if not p.exists():
        logger.warning("Data quality report not found. Skipping DB log.")
        return

    with open(p, "r", encoding="utf-8") as f:
        rep = json.load(f)

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO data_quality_reports (total_records, quality_score, duplicate_count, invalid_timestamps, metrics_json)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                rep.get("total_records", 0),
                rep.get("data_quality_score", 100.0),
                rep.get("duplicate_event_ids", 0),
                rep.get("invalid_timestamps", 0),
                json.dumps(rep)
            ))
            conn.commit()
            logger.info("Inserted Data Quality Audit report into MySQL.")
    finally:
        conn.close()


def bulk_insert_alerts(parquet_path: str = "data/processed/cleaned_alerts.parquet", batch_size: int = 5000):
    """
    Reads processed Parquet file and bulk-inserts alerts and features in batches.
    """
    start_time = time.time()
    logger.info("=" * 60)
    logger.info("BULK LOADING PROCESSED ALERTS INTO MYSQL")
    logger.info(f"Source file: {parquet_path}, Batch size: {batch_size}")
    logger.info("=" * 60)

    df = pd.read_parquet(parquet_path)
    total_records = len(df)
    logger.info(f"Loaded {total_records} rows from Parquet for MySQL bulk ingestion.")

    conn = get_db_connection()
    
    # Check if data already exists in alerts
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM alerts;")
        existing_count = cur.fetchone()[0]
        if existing_count > 0:
            logger.warning(f"Table `alerts` already has {existing_count} records. Truncating for fresh ingestion...")
            cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
            cur.execute("TRUNCATE TABLE alerts;")
            cur.execute("TRUNCATE TABLE alert_features;")
            cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
            conn.commit()

    alert_insert_sql = """
        INSERT INTO alerts (
            alert_id, timestamp, event_type, source, severity, severity_num,
            alert_type, category, affected_system, asset_category,
            user_id, src_ip, dst_ip, risk_score, confidence, geo_location,
            is_anomaly, mitre_technique, is_incident, incident_probability,
            noise_score, noise_level, priority, resolution_status, raw_log, description
        ) VALUES (
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s
        )
    """

    feat_insert_sql = """
        INSERT INTO alert_features (
            alert_id, hour, day_of_week, business_hours, night_time,
            repeated_alert_count, alert_burst_score, time_since_previous_similar_alert,
            source_alert_frequency, system_alert_frequency, alert_type_frequency,
            severity_weight
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s
        )
    """

    inserted_alerts = 0
    try:
        with conn.cursor() as cur:
            for start_idx in range(0, total_records, batch_size):
                end_idx = min(start_idx + batch_size, total_records)
                chunk = df.iloc[start_idx:end_idx]

                # Prepare alert rows
                alert_rows = []
                feat_rows = []
                for _, r in chunk.iterrows():
                    ts = r["timestamp"]
                    if hasattr(ts, "to_pydatetime"):
                        ts = ts.to_pydatetime()

                    alert_rows.append((
                        r["alert_id"],
                        ts,
                        r["event_type"],
                        r["source"],
                        r["severity"],
                        int(r["severity_num"]),
                        r["alert_type"],
                        r["category"],
                        r["affected_system"],
                        r["asset_category"],
                        str(r["user"])[:64],
                        str(r["src_ip"])[:64],
                        str(r["dst_ip"])[:64],
                        float(r["risk_score"]),
                        float(r["confidence"]),
                        str(r["geo_location"])[:100],
                        bool(r["is_anomaly"]),
                        str(r["mitre_technique"])[:32],
                        bool(r["is_incident"]),
                        0.0, # incident_probability initially 0, updated after ML
                        float(r["noise_score"]),
                        str(r["noise_level"]),
                        "MEDIUM", # priority default, updated after Prioritization Engine
                        str(r["resolution_status"]),
                        str(r["raw_log"])[:500],
                        str(r["description"])[:500]
                    ))

                    feat_rows.append((
                        r["alert_id"],
                        int(r["hour"]),
                        int(r["day_of_week"]),
                        int(r["business_hours"]),
                        int(r["night_time"]),
                        int(r.get("repeated_alert_count", 1)),
                        float(r.get("alert_burst_score", 0.0)),
                        float(r.get("time_since_previous_similar_alert", 86400)),
                        float(r.get("source_alert_frequency", 0.0)),
                        float(r.get("system_alert_frequency", 0.0)),
                        float(r.get("alert_type_frequency", 0.0)),
                        float(r.get("severity_weight", 1.0))
                    ))

                cur.executemany(alert_insert_sql, alert_rows)
                cur.executemany(feat_insert_sql, feat_rows)
                conn.commit()

                inserted_alerts += len(alert_rows)
                logger.info(f"Inserted batch {start_idx} -> {end_idx} ({inserted_alerts}/{total_records} rows)...")

        # Verify final count in MySQL
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM alerts;")
            final_alerts = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM alert_features;")
            final_feats = cur.fetchone()[0]
            
            logger.info("=" * 60)
            logger.info(f"FINAL INGESTION SUMMARY:")
            logger.info(f"Rows in `alerts`: {final_alerts}")
            logger.info(f"Rows in `alert_features`: {final_feats}")
            logger.info(f"Time Taken: {time.time() - start_time:.2f} seconds")
            logger.info("=" * 60)

    except Exception as e:
        conn.rollback()
        logger.error(f"Error during bulk insert: {e}")
        raise
    finally:
        conn.close()

    load_data_quality_report_into_db()


if __name__ == "__main__":
    bulk_insert_alerts()
