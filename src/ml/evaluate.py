"""
CyberAlert-Prioritization: Model Evaluation & Performance Audit Module
Evaluates trained Random Forest model on out-of-time test partitions.
Analyzes False Negatives, False Positives, Precision-Recall curves, and operational trade-offs.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, Any
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve, classification_report
)

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("evaluate_ml")


def evaluate_model(
    model_path: str = "models/random_forest.joblib",
    feature_cols_path: str = "models/feature_columns.json",
    parquet_path: str = "data/processed/cleaned_alerts.parquet",
    train_ratio: float = 0.80
) -> Dict[str, Any]:
    """
    Evaluates the serialized model on the chronological test holdout set.
    """
    logger.info("Starting out-of-time model evaluation...")
    rf = joblib.load(model_path)
    with open(feature_cols_path, "r", encoding="utf-8") as f:
        feature_names = json.load(f)

    df = pd.read_parquet(parquet_path)
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.sort_values(by="timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)

    # Reconstruct exact feature matrix
    from src.ml.train import FEATURE_COLUMNS, CATEGORICAL_ENCODE_COLS
    X_num = df[FEATURE_COLUMNS].copy()
    X_cat = pd.get_dummies(df[CATEGORICAL_ENCODE_COLS], drop_first=True, dtype=int)
    X = pd.concat([X_num, X_cat], axis=1)
    
    # Align columns
    for col in feature_names:
        if col not in X.columns:
            X[col] = 0
    X = X[feature_names]
    y = df["is_incident"].astype(int)

    # Test partition (last 20% chronologically)
    split_idx = int(len(df) * train_ratio)
    X_test = X.iloc[split_idx:]
    y_test = y.iloc[split_idx:]
    df_test = df.iloc[split_idx:].copy()

    # Inference
    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    # Metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    pr_auc = float(average_precision_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # ROC and PR curves (sampled to 50 points for JSON serialization)
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    step_roc = max(1, len(fpr) // 50)
    roc_points = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr[::step_roc], tpr[::step_roc])]

    precision_pts, recall_pts, _ = precision_recall_curve(y_test, y_prob)
    step_pr = max(1, len(precision_pts) // 50)
    pr_points = [{"recall": round(float(r), 4), "precision": round(float(p), 4)} for r, p in zip(recall_pts[::step_pr], precision_pts[::step_pr])]

    # Operational SOC Impact Analysis
    false_negative_rate = round(float(fn / (fn + tp)) * 100, 2) if (fn + tp) > 0 else 0.0
    false_positive_rate = round(float(fp / (fp + tn)) * 100, 2) if (fp + tn) > 0 else 0.0

    eval_report = {
        "evaluation_timestamp": pd.Timestamp.utcnow().isoformat(),
        "test_records": len(X_test),
        "actual_incidents": int(y_test.sum()),
        "predicted_incidents": int(y_pred.sum()),
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4)
        },
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "soc_operational_impact": {
            "incident_recall_pct": round(rec * 100, 2),
            "false_negative_rate_pct": false_negative_rate,
            "false_positive_rate_pct": false_positive_rate,
            "analyst_workload_reduction_pct": round((1.0 - (y_pred.sum() / len(y_test))) * 100, 2),
            "assessment": "High recall ensures critical threat coverage while precision reduces Tier-1 analyst triage fatigue."
        },
        "roc_curve": roc_points,
        "pr_curve": pr_points
    }

    out_file = Path("models/evaluation_report.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    logger.info(f"Saved evaluation report to {out_file.resolve()}")
    return eval_report


if __name__ == "__main__":
    report = evaluate_model()
    print("\n--- EVALUATION REPORT SUMMARY ---")
    print(f"Test Accuracy: {report['metrics']['accuracy'] * 100:.2f}%")
    print(f"Precision:     {report['metrics']['precision'] * 100:.2f}%")
    print(f"Recall:        {report['metrics']['recall'] * 100:.2f}%")
    print(f"F1-Score:      {report['metrics']['f1_score'] * 100:.2f}%")
    print(f"ROC-AUC:       {report['metrics']['roc_auc']:.4f}")
    print(f"PR-AUC:        {report['metrics']['pr_auc']:.4f}")
    print(f"Confusion Matrix: {report['confusion_matrix']}")
    print(f"Analyst Workload Reduction: {report['soc_operational_impact']['analyst_workload_reduction_pct']}%")
