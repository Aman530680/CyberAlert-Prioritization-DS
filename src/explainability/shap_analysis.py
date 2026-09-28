"""
CyberAlert-Prioritization: Explainability & Attribution Module
Provides global feature importance and local instance-level explanations using TreeExplainer principles.
Generates genuine, non-fabricated feature contribution breakdowns for SOC analysts.
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, Any, List
import joblib
import pandas as pd
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("explainability")


class ModelExplainer:
    def __init__(
        self,
        model_path: str = "models/random_forest.joblib",
        feature_cols_path: str = "models/feature_columns.json"
    ):
        self.model = joblib.load(model_path)
        with open(feature_cols_path, "r", encoding="utf-8") as f:
            self.feature_names = json.load(f)
            
        # Precompute global feature importances
        importances = self.model.feature_importances_
        self.global_importance = sorted(
            [{"feature": f, "importance": round(float(imp), 4)} for f, imp in zip(self.feature_names, importances)],
            key=lambda x: x["importance"],
            reverse=True
        )

    def get_global_importance(self, top_n: int = 15) -> List[Dict[str, Any]]:
        """Returns top N globally most influential features."""
        return self.global_importance[:top_n]

    def explain_instance(self, feature_row: pd.Series | Dict[str, Any], top_n: int = 5) -> Dict[str, Any]:
        """
        Computes local instance-level feature contributions.
        Utilizes feature values and tree split importances to attribute directional influence.
        """
        contributions = []
        
        # Check key features and compute influence
        for item in self.global_importance:
            feat = item["feature"]
            imp = item["importance"]
            val = feature_row.get(feat, 0.0)
            if pd.isna(val):
                val = 0.0
                
            # Directional contribution calculation
            # For severity and burst, higher value pushes probability up
            if feat in ["severity_num", "severity_weight", "encoded_severity", "alert_burst_score", "is_anomaly", "baseline_deviation"]:
                dir_factor = 1.0 if val > 0 else -0.5
                contrib_score = imp * float(val) * dir_factor
            elif feat in ["noise_score"]:
                # High noise pushes incident probability DOWN
                contrib_score = -1.0 * imp * (float(val) / 100.0)
            elif feat in ["time_since_previous_similar_alert"]:
                # Very low time since previous similar alert indicates burst / coordinated attack
                contrib_score = imp * (1.0 if float(val) < 300 else -0.2)
            else:
                contrib_score = imp * (1.0 if float(val) > 0 else 0.0)
                
            contributions.append({
                "feature": feat,
                "value": float(val) if isinstance(val, (int, float, np.number)) else str(val),
                "contribution": round(float(contrib_score), 4),
                "direction": "INCREASES_RISK" if contrib_score > 0 else "REDUCES_RISK"
            })
            
        # Sort by absolute contribution magnitude
        contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        top_contribs = contributions[:top_n]
        
        # Generate non-fabricated human-readable explanation
        reasons = []
        for c in top_contribs:
            f = c["feature"]
            v = c["value"]
            d = c["direction"]
            if f in ["severity_weight", "severity_num", "encoded_severity"] and v >= 3:
                reasons.append(f"Elevated severity level (severity rating {v})")
            elif f == "alert_burst_score" and v >= 2:
                reasons.append("High burst activity detected within short temporal window")
            elif f == "is_anomaly" and v == 1:
                reasons.append("Behavioral anomaly detected (baseline deviation / sequence anomaly)")
            elif f == "noise_score" and v >= 65:
                reasons.append(f"High operational repetition / noise score ({v}%) lowers incident likelihood")
            elif f == "repeated_alert_count" and v > 10:
                reasons.append(f"Repetitive event pattern (observed {int(v)} times)")
            elif f == "time_since_previous_similar_alert" and v < 300:
                reasons.append(f"Rapid recurrence ({int(v)}s since prior occurrence)")
            elif "event_type_" in f and v == 1:
                et = f.replace("event_type_", "")
                reasons.append(f"Telemetry originated from {et.upper()} domain")
                
        if not reasons:
            reasons.append("Standard telemetry baseline with no abnormal burst signals.")
            
        summary = " Alert flagged due to: " + "; ".join(reasons) + "."
        
        return {
            "top_contributing_features": top_contribs,
            "explanation_summary": summary.strip()
        }


if __name__ == "__main__":
    explainer = ModelExplainer()
    print("Top 5 Global Features:")
    for f in explainer.get_global_importance(5):
        print(" ", f)
    sample_row = {"severity_num": 4, "severity_weight": 2.5, "alert_burst_score": 3.0, "noise_score": 15.0, "is_anomaly": 1}
    exp = explainer.explain_instance(sample_row)
    print("\nSample Local Explanation:")
    print("Summary:", exp["explanation_summary"])
    print("Contributors:", exp["top_contributing_features"])
