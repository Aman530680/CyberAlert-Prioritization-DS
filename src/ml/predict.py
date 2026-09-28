"""
CyberAlert-Prioritization: Production Inference Service
Loads serialized Random Forest model once at runtime.
Accepts raw or structured alert payloads and returns:
- incident_probability
- priority (CRITICAL, HIGH, MEDIUM, LOW)
- noise_score and noise_level
- severity
- explanation
- contributing_features
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timezone
import joblib
import pandas as pd
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from src.explainability.shap_analysis import ModelExplainer
from src.ml.prioritization import calculate_priority_score
from src.data.cleaning import clean_single_record, SEVERITY_WEIGHT_MAP
from src.ml.train import FEATURE_COLUMNS, CATEGORICAL_ENCODE_COLS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("predict_ml")


class AlertPredictor:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(AlertPredictor, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(
        self,
        model_path: str = "models/random_forest.joblib",
        feature_cols_path: str = "models/feature_columns.json"
    ):
        if self._initialized:
            return
            
        logger.info(f"Initializing AlertPredictor singleton from {model_path}...")
        self.model_path = Path(model_path)
        self.feature_cols_path = Path(feature_cols_path)
        
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model artifact not found at: {self.model_path.resolve()}")
            
        self.model = joblib.load(self.model_path)
        with open(self.feature_cols_path, "r", encoding="utf-8") as f:
            self.feature_names = json.load(f)
            
        self.explainer = ModelExplainer(str(self.model_path), str(self.feature_cols_path))
        self._initialized = True
        logger.info(f"AlertPredictor initialized successfully with {len(self.feature_names)} features.")

    def predict_single(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes end-to-end inference, noise calculation, explainability, and triage prioritization for a single alert.
        """
        # 1. Clean and normalize input if raw
        if "alert_id" not in alert_data or "event_type" not in alert_data:
            cleaned = clean_single_record(alert_data)
        else:
            cleaned = alert_data.copy()
            
        severity = str(cleaned.get("severity", "medium")).lower()
        sev_num = SEVERITY_WEIGHT_MAP.get(severity, 2)
        event_type = cleaned.get("event_type", "ids_alert")
        asset_cat = cleaned.get("asset_category", "Target Network Host")
        category = cleaned.get("category", "Exploit")
        
        # 2. Extract or approximate feature values
        ts = cleaned.get("timestamp", datetime.now(timezone.utc))
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.now(timezone.utc)
                
        hour = ts.hour if hasattr(ts, "hour") else 12
        dow = ts.weekday() if hasattr(ts, "weekday") else 2
        is_weekend = 1 if dow >= 5 else 0
        biz_hours = 1 if (8 <= hour < 18 and not is_weekend) else 0
        night_time = 1 if (hour >= 22 or hour < 6) else 0
        
        # Repetition & burst inputs
        rep_count = float(cleaned.get("repeated_alert_count", 1))
        burst_score = float(cleaned.get("alert_burst_score", 0.0))
        time_since = float(cleaned.get("time_since_previous_similar_alert", 86400))
        is_anomaly = 1 if cleaned.get("is_anomaly", False) else 0
        base_dev = float(cleaned.get("baseline_deviation", 0.0))
        entropy = float(cleaned.get("entropy", 0.0))
        
        # Noise score calculation
        # If noise_score was passed, use it; otherwise compute fast inline
        if "noise_score" in cleaned and cleaned["noise_score"] is not None:
            noise_score = float(cleaned["noise_score"])
        else:
            s_sev = 1.0 if severity == "info" else (0.8 if severity == "low" else (0.4 if severity == "medium" else 0.1))
            s_rep = min(1.0, np.log1p(rep_count) / np.log1p(50))
            raw_n = (0.35 * s_sev + 0.35 * s_rep + 0.30 * (0.0 if is_anomaly else 1.0)) * 100.0
            if severity in ["critical", "emergency"]:
                raw_n = min(raw_n, 25.0)
            noise_score = round(raw_n, 2)
            
        noise_level = "HIGH" if noise_score >= 65.0 else ("MEDIUM" if noise_score >= 35.0 else "LOW")
        
        # Build one-row feature vector
        row_dict = {
            "severity_num": sev_num,
            "severity_weight": {0: 0.1, 1: 0.3, 2: 0.6, 3: 1.2, 4: 2.5, 5: 4.0}.get(sev_num, 0.6),
            "encoded_severity": sev_num,
            "hour": hour,
            "day_of_week": dow,
            "business_hours": biz_hours,
            "night_time": night_time,
            "hour_sin": np.sin(2 * np.pi * hour / 24.0),
            "hour_cos": np.cos(2 * np.pi * hour / 24.0),
            "day_sin": np.sin(2 * np.pi * dow / 7.0),
            "day_cos": np.cos(2 * np.pi * dow / 7.0),
            "alert_count_per_hour": cleaned.get("alert_count_per_hour", 50),
            "alert_count_per_day": cleaned.get("alert_count_per_day", 1200),
            "source_alert_frequency": cleaned.get("source_alert_frequency", 0.05),
            "system_alert_frequency": cleaned.get("system_alert_frequency", 0.001),
            "alert_type_frequency": cleaned.get("alert_type_frequency", 0.02),
            "repeated_alert_count": rep_count,
            "alert_burst_score": burst_score,
            "time_since_previous_similar_alert": time_since,
            "same_source_repetition": cleaned.get("same_source_repetition", 10),
            "same_system_repetition": cleaned.get("same_system_repetition", 5),
            "same_type_repetition": cleaned.get("same_type_repetition", 10),
            "is_anomaly": is_anomaly,
            "baseline_deviation": base_dev,
            "entropy": entropy,
            "noise_score": noise_score
        }
        
        # One-hot categorical indicators
        for fn in self.feature_names:
            if fn.startswith("event_type_"):
                row_dict[fn] = 1 if fn == f"event_type_{event_type}" else 0
            elif fn.startswith("asset_category_"):
                row_dict[fn] = 1 if fn == f"asset_category_{asset_cat}" else 0
            elif fn.startswith("category_"):
                row_dict[fn] = 1 if fn == f"category_{category}" else 0
                
        # Create aligned DataFrame row
        feature_vector = pd.DataFrame([row_dict])
        for col in self.feature_names:
            if col not in feature_vector.columns:
                feature_vector[col] = 0
        feature_vector = feature_vector[self.feature_names]
        
        # ML Inference
        prob = float(self.model.predict_proba(feature_vector)[0, 1])
        incident_pred = int(prob >= 0.50)
        
        # Prioritization
        prio_result = calculate_priority_score(
            incident_prob=prob,
            severity=severity,
            asset_category=asset_cat,
            burst_score=burst_score,
            noise_score=noise_score
        )
        
        # Explainability
        explanation = self.explainer.explain_instance(row_dict, top_n=5)
        
        return {
            "alert_id": cleaned.get("alert_id") or cleaned.get("event_id") or "LIVE-API-ALERT",
            "incident_probability": round(prob, 4),
            "is_incident_predicted": bool(incident_pred),
            "priority": prio_result["priority_level"],
            "priority_score": prio_result["priority_score"],
            "priority_reasons": prio_result["reasons"],
            "noise_score": noise_score,
            "noise_level": noise_level,
            "severity": severity,
            "explanation": explanation["explanation_summary"],
            "contributing_features": explanation["top_contributing_features"]
        }


def get_predictor() -> AlertPredictor:
    """Convenience getter for singleton predictor instance."""
    return AlertPredictor()


if __name__ == "__main__":
    predictor = get_predictor()
    test_alert = {
        "event_id": "test-alert-1234",
        "timestamp": "2025-05-15T03:30:00",
        "event_type": "ids_alert",
        "source": "Microsoft Sentinel v1.0.0",
        "severity": "critical",
        "alert_type": "Zero-Day Exploit",
        "category": "Exploit",
        "affected_system": "192.168.1.100",
        "asset_category": "Target Network Host",
        "alert_burst_score": 3.0,
        "is_anomaly": True
    }
    res = predictor.predict_single(test_alert)
    print("\nTest Prediction Result:")
    print(json.dumps(res, indent=2))
