"""
CyberAlert-Prioritization: MySQL Alert Predictions & Priority Update Script
Calculates out-of-fold/full model probabilities and updates `alerts` table in MySQL
with incident_probability and priority tier (CRITICAL, HIGH, MEDIUM, LOW).
"""

import os
import sys
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
import pymysql
import pandas as pd
import numpy as np
import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.ml.train import FEATURE_COLUMNS, CATEGORICAL_ENCODE_COLS
from src.ml.prioritization import prioritize_dataframe

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("update_priorities")


def update_mysql_priorities(
    parquet_path: str = "data/processed/cleaned_alerts.parquet",
    model_path: str = "models/random_forest.joblib",
    feature_cols_path: str = "models/feature_columns.json",
    batch_size: int = 5000
):
    start_time = time.time()
    logger.info("Starting batch prediction and priority updates in MySQL...")
    
    # 1. Load Model & Features
    rf = joblib.load(model_path)
    import json
    with open(feature_cols_path, "r", encoding="utf-8") as f:
        feature_names = json.load(f)
        
    df = pd.read_parquet(parquet_path)
    logger.info(f"Loaded {len(df)} alerts from Parquet.")
    
    # Prepare feature matrix
    X_num = df[FEATURE_COLUMNS].copy()
    X_cat = pd.get_dummies(df[CATEGORICAL_ENCODE_COLS], drop_first=True, dtype=int)
    X = pd.concat([X_num, X_cat], axis=1)
    for col in feature_names:
        if col not in X.columns:
            X[col] = 0
    X = X[feature_names]
    
    # Predict probabilities
    logger.info("Computing model probabilities...")
    probs = rf.predict_proba(X)[:, 1]
    df["incident_probability"] = np.round(probs, 4)
    
    # Prioritize
    logger.info("Calculating triage priorities...")
    df_prio = prioritize_dataframe(df, prob_col="incident_probability")
    
    # Update MySQL
    conn = pymysql.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "cyberalert_db"),
        charset="utf8mb4",
        autocommit=False
    )
    
    update_sql = """
        UPDATE alerts 
        SET incident_probability = %s, priority = %s
        WHERE alert_id = %s;
    """
    
    total = len(df_prio)
    logger.info(f"Executing batch update on {total} MySQL records...")
    
    try:
        with conn.cursor() as cur:
            for start_idx in range(0, total, batch_size):
                end_idx = min(start_idx + batch_size, total)
                chunk = df_prio.iloc[start_idx:end_idx]
                
                rows = [
                    (float(r["incident_probability"]), str(r["priority"]), str(r["alert_id"]))
                    for _, r in chunk.iterrows()
                ]
                cur.executemany(update_sql, rows)
                conn.commit()
                logger.info(f"Updated {end_idx}/{total} alerts in MySQL...")
                
        # Also update the parquet file with incident_probability and priority
        df_prio.to_parquet(parquet_path, index=False, engine="pyarrow")
        logger.info(f"Updated Parquet file with priorities and probabilities.")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to update MySQL: {e}")
        raise
    finally:
        conn.close()
        
    logger.info(f"Priority updates completed in {time.time() - start_time:.2f} seconds.")


if __name__ == "__main__":
    update_mysql_priorities()
