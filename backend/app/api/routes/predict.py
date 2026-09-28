"""
CyberAlert-Prioritization: Live Alert Prediction Endpoint
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas.predict import PredictRequest, PredictResponse
from src.ml.predict import get_predictor

router = APIRouter(tags=["Inference"])


@router.post("/predict", response_model=PredictResponse)
def predict_alert(payload: PredictRequest):
    """
    Evaluates an incoming alert in real time:
    - Calculates incident probability via serialized Random Forest model
    - Assigns triage priority tier (CRITICAL, HIGH, MEDIUM, LOW)
    - Computes explainable noise score
    - Delivers SHAP-based feature attributions and natural-language explanation
    """
    try:
        predictor = get_predictor()
        res = predictor.predict_single(payload.model_dump())
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
