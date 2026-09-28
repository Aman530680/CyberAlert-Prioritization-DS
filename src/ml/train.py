"""
CyberAlert-Prioritization: Random Forest Model Training Pipeline
Performs chronological train/test splitting to prevent temporal look-ahead leakage.
Applies class weighting to manage class imbalance (~5.45% positive incidence).
Exports serialized model artifacts, feature schemas, and training metadata.
"""

import os
import sys
import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)
import pymysql
from dotenv import load_dotenv

# Ensure root on PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("train_ml")

FEATURE_COLUMNS = [
    # Severity & Weights
    "severity_num",
    "severity_weight",
    "encoded_severity",
    
    # Temporal & Periodicity
    "hour",
    "day_of_week",
    "business_hours",
    "night_time",
    "hour_sin",
    "hour_cos",
    "day_sin",
    "day_cos",
    
    # Frequency & Velocity
    "alert_count_per_hour",
    "alert_count_per_day",
    "source_alert_frequency",
    "system_alert_frequency",
    "alert_type_frequency",
    
    # Repetition & Bursts
    "repeated_alert_count",
    "alert_burst_score",
    "time_since_previous_similar_alert",
    "same_source_repetition",
    "same_system_repetition",
    "same_type_repetition",
    
    # Behavioral & Anomalies
    "is_anomaly",
    "baseline_deviation",
    "entropy",
    
    # Operational Noise Score
    "noise_score"
]

CATEGORICAL_ENCODE_COLS = ["event_type", "asset_category", "category"]


def prepare_training_data(
    parquet_path: str = "data/processed/cleaned_alerts.parquet",
    train_ratio: float = 0.80
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, list]:
    """
    Loads dataset, performs chronological train/test split, and one-hot encodes categorical dimensions.
    """
    logger.info(f"Loading engineered dataset from {parquet_path}...")
    df = pd.read_parquet(parquet_path)
    
    # Enforce chronological ordering
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.sort_values(by="timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)
    
    # Prepare feature set
    X_num = df[FEATURE_COLUMNS].copy()
    X_cat = pd.get_dummies(df[CATEGORICAL_ENCODE_COLS], drop_first=True, dtype=int)
    X = pd.concat([X_num, X_cat], axis=1)
    
    y = df["is_incident"].astype(int)
    
    all_feature_cols = list(X.columns)
    
    # Chronological Split (No random shuffle to prevent temporal leakage)
    split_idx = int(len(df) * train_ratio)
    X_train = X.iloc[:split_idx]
    X_test = X.iloc[split_idx:]
    y_train = y.iloc[:split_idx]
    y_test = y.iloc[split_idx:]
    
    logger.info(f"Chronological split: Train={len(X_train)} ({y_train.sum()} incidents), Test={len(X_test)} ({y_test.sum()} incidents)")
    logger.info(f"Total features used: {len(all_feature_cols)}")
    return X_train, X_test, y_train, y_test, all_feature_cols, df


def train_random_forest(
    parquet_path: str = "data/processed/cleaned_alerts.parquet",
    n_estimators: int = 150,
    max_depth: int = 14,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Trains the Random Forest Classifier, evaluates performance, and saves model artifacts.
    """
    start_time = time.time()
    logger.info("=" * 60)
    logger.info("PHASE 10: RANDOM FOREST TRAINING INITIATION")
    logger.info(f"Config: n_estimators={n_estimators}, max_depth={max_depth}, random_state={random_state}")
    logger.info("=" * 60)
    
    X_train, X_test, y_train, y_test, feature_names, full_df = prepare_training_data(parquet_path)
    
    # Initialize Random Forest with balanced class weights for incident minority class
    rf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=8,
        min_samples_leaf=4,
        class_weight="balanced_subsample",
        random_state=random_state,
        n_jobs=-1
    )
    
    logger.info("Fitting Random Forest Classifier...")
    rf.fit(X_train, y_train)
    train_duration = time.time() - start_time
    logger.info(f"Model fitted successfully in {train_duration:.2f} seconds.")
    
    # Predictions
    y_pred_train = rf.predict(X_train)
    y_prob_train = rf.predict_proba(X_train)[:, 1]
    
    y_pred_test = rf.predict(X_test)
    y_prob_test = rf.predict_proba(X_test)[:, 1]
    
    # Metrics
    train_acc = float(accuracy_score(y_train, y_pred_train))
    test_acc = float(accuracy_score(y_test, y_pred_test))
    prec = float(precision_score(y_test, y_pred_test, zero_division=0))
    rec = float(recall_score(y_test, y_pred_test, zero_division=0))
    f1 = float(f1_score(y_test, y_pred_test, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob_test))
    pr_auc = float(average_precision_score(y_test, y_prob_test))
    cm = confusion_matrix(y_test, y_pred_test).tolist()
    
    logger.info("=" * 60)
    logger.info("MODEL EVALUATION RESULTS (TEST SET):")
    logger.info(f"Accuracy:  {test_acc * 100:.2f}%")
    logger.info(f"Precision: {prec * 100:.2f}%")
    logger.info(f"Recall:    {rec * 100:.2f}%")
    logger.info(f"F1-Score:  {f1 * 100:.2f}%")
    logger.info(f"ROC-AUC:   {roc_auc:.4f}")
    logger.info(f"PR-AUC:    {pr_auc:.4f}")
    logger.info(f"Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    logger.info("=" * 60)
    
    # Feature Importance
    importances = rf.feature_importances_
    feat_imp = sorted(
        [{"feature": f, "importance": round(float(imp), 4)} for f, imp in zip(feature_names, importances)],
        key=lambda x: x["importance"],
        reverse=True
    )
    
    # Save Model Artifacts
    models_dir = Path("models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = models_dir / "random_forest.joblib"
    joblib.dump(rf, model_path)
    logger.info(f"Saved trained Random Forest model to {model_path.resolve()}")
    
    feature_cols_path = models_dir / "feature_columns.json"
    with open(feature_cols_path, "w", encoding="utf-8") as f:
        json.dump(feature_names, f, indent=2)
    logger.info(f"Saved feature schema ({len(feature_names)} features) to {feature_cols_path.resolve()}")
    
    metadata = {
        "model_name": "CyberAlert_RandomForest_v1",
        "algorithm": "RandomForestClassifier",
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "hyperparameters": {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "min_samples_split": 8,
            "min_samples_leaf": 4,
            "class_weight": "balanced_subsample",
            "random_state": random_state
        },
        "dataset": {
            "total_records": len(full_df),
            "train_size": len(X_train),
            "test_size": len(X_test),
            "split_type": "chronological",
            "positive_class_ratio": round(float(full_df["is_incident"].mean()), 4)
        },
        "metrics": {
            "train_accuracy": train_acc,
            "test_accuracy": test_acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
            "confusion_matrix": {
                "true_negative": cm[0][0],
                "false_positive": cm[0][1],
                "false_negative": cm[1][0],
                "true_positive": cm[1][1]
            }
        },
        "top_features": feat_imp[:15]
    }
    
    meta_path = models_dir / "model_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved model metadata to {meta_path.resolve()}")
    
    # Record to MySQL Database
    record_model_run_in_db(metadata, feat_imp)
    
    return metadata


def record_model_run_in_db(meta: Dict[str, Any], feat_imp: list):
    """Saves model run evaluation metrics into MySQL model_runs and model_metrics tables."""
    try:
        conn = pymysql.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),
            database=os.getenv("MYSQL_DATABASE", "cyberalert_db"),
            charset="utf8mb4",
            autocommit=True
        )
        with conn.cursor() as cur:
            m = meta["metrics"]
            hp = meta["hyperparameters"]
            ds = meta["dataset"]
            
            cur.execute("""
                INSERT INTO model_runs (
                    model_name, algorithm, n_estimators, max_depth,
                    train_size, test_size, train_accuracy, test_accuracy,
                    precision_score, recall_score, f1_score, roc_auc, pr_auc,
                    confusion_matrix
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                meta["model_name"], meta["algorithm"], hp["n_estimators"], hp["max_depth"],
                ds["train_size"], ds["test_size"], m["train_accuracy"], m["test_accuracy"],
                m["precision"], m["recall"], m["f1_score"], m["roc_auc"], m["pr_auc"],
                json.dumps(m["confusion_matrix"])
            ))
            run_id = cur.lastrowid
            
            # Insert top feature metrics
            for item in feat_imp[:15]:
                cur.execute("""
                    INSERT INTO model_metrics (run_id, metric_name, metric_value, metric_details)
                    VALUES (%s, %s, %s, %s)
                """, (run_id, f"importance_{item['feature']}", item["importance"], json.dumps(item)))
                
            logger.info(f"Successfully recorded Model Run #{run_id} into MySQL `model_runs` and `model_metrics` tables.")
        conn.close()
    except Exception as e:
        logger.warning(f"Could not record model run into MySQL: {e}")


if __name__ == "__main__":
    train_random_forest()
