"""
CyberAlert-Prioritization: Database Setup & Schema Provisioning Script
Connects to MySQL server, ensures cyberalert_db exists, and sets up indexed production tables.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
import pymysql

# Load .env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("setup_db")

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "cyberalert_db")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")


CREATE_TABLES_SQL = [
    # 1. Main Alerts Table
    f"""
    CREATE TABLE IF NOT EXISTS alerts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        alert_id VARCHAR(64) NOT NULL UNIQUE,
        timestamp DATETIME NOT NULL,
        event_type VARCHAR(32) NOT NULL,
        source VARCHAR(64) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        severity_num TINYINT NOT NULL DEFAULT 2,
        alert_type VARCHAR(64) NOT NULL,
        category VARCHAR(64) NOT NULL,
        affected_system VARCHAR(128) NOT NULL,
        asset_category VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) DEFAULT 'N/A',
        src_ip VARCHAR(64) DEFAULT 'N/A',
        dst_ip VARCHAR(64) DEFAULT 'N/A',
        risk_score FLOAT NOT NULL DEFAULT 50.0,
        confidence FLOAT NOT NULL DEFAULT 0.5,
        geo_location VARCHAR(100) DEFAULT 'Unknown',
        is_anomaly BOOLEAN NOT NULL DEFAULT 0,
        mitre_technique VARCHAR(32) DEFAULT 'None',
        is_incident BOOLEAN NOT NULL DEFAULT 0,
        incident_probability FLOAT NOT NULL DEFAULT 0.0,
        noise_score FLOAT NOT NULL DEFAULT 0.0,
        noise_level VARCHAR(16) NOT NULL DEFAULT 'LOW',
        priority VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
        resolution_status VARCHAR(32) NOT NULL DEFAULT 'Open',
        raw_log TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp),
        INDEX idx_severity (severity),
        INDEX idx_alert_type (alert_type),
        INDEX idx_source (source),
        INDEX idx_affected_system (affected_system),
        INDEX idx_is_incident (is_incident),
        INDEX idx_priority (priority),
        INDEX idx_noise_level (noise_level),
        INDEX idx_resolution_status (resolution_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 2. Alert Features Table
    f"""
    CREATE TABLE IF NOT EXISTS alert_features (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        alert_id VARCHAR(64) NOT NULL UNIQUE,
        hour TINYINT NOT NULL,
        day_of_week TINYINT NOT NULL,
        business_hours TINYINT NOT NULL,
        night_time TINYINT NOT NULL,
        repeated_alert_count INT NOT NULL DEFAULT 1,
        alert_burst_score FLOAT NOT NULL DEFAULT 0.0,
        time_since_previous_similar_alert FLOAT NOT NULL DEFAULT 86400,
        source_alert_frequency FLOAT NOT NULL DEFAULT 0.0,
        system_alert_frequency FLOAT NOT NULL DEFAULT 0.0,
        alert_type_frequency FLOAT NOT NULL DEFAULT 0.0,
        severity_weight FLOAT NOT NULL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_feat_alert_id (alert_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 3. Model Runs Table
    f"""
    CREATE TABLE IF NOT EXISTS model_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        model_name VARCHAR(64) NOT NULL,
        algorithm VARCHAR(64) NOT NULL,
        n_estimators INT NOT NULL,
        max_depth INT,
        train_size INT NOT NULL,
        test_size INT NOT NULL,
        train_accuracy FLOAT NOT NULL,
        test_accuracy FLOAT NOT NULL,
        precision_score FLOAT NOT NULL,
        recall_score FLOAT NOT NULL,
        f1_score FLOAT NOT NULL,
        roc_auc FLOAT NOT NULL,
        pr_auc FLOAT NOT NULL,
        confusion_matrix JSON NOT NULL,
        run_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 4. Model Metrics & Feature Importance Table
    f"""
    CREATE TABLE IF NOT EXISTS model_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_id INT NOT NULL,
        metric_name VARCHAR(64) NOT NULL,
        metric_value FLOAT NOT NULL,
        metric_details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_run_id (run_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """,

    # 5. Data Quality Reports Table
    f"""
    CREATE TABLE IF NOT EXISTS data_quality_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_records INT NOT NULL,
        quality_score FLOAT NOT NULL,
        duplicate_count INT NOT NULL,
        invalid_timestamps INT NOT NULL,
        metrics_json JSON NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
]


def setup_database():
    """Connects to MySQL and executes DDL table creation."""
    logger.info(f"Connecting to MySQL at {MYSQL_HOST}:{MYSQL_PORT} as {MYSQL_USER}...")
    try:
        # First connect without DB to ensure database exists
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            charset="utf8mb4",
            autocommit=True
        )
        with conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            logger.info(f"Database `{MYSQL_DATABASE}` verified.")
        conn.close()

        # Connect directly to target DB
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset="utf8mb4",
            autocommit=True
        )
        with conn.cursor() as cur:
            for sql in CREATE_TABLES_SQL:
                cur.execute(sql)
            logger.info("All database tables created successfully with optimal indexes!")

            # Verify tables
            cur.execute("SHOW TABLES;")
            tables = [row[0] for row in cur.fetchall()]
            logger.info(f"Existing tables in `{MYSQL_DATABASE}`: {tables}")
            
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise


if __name__ == "__main__":
    setup_database()
