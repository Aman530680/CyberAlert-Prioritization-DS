"""
CyberAlert-Prioritization: Empirical Insights & SOC Action Plan Routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["Insights & Action Plan"])


@router.get("/insights")
def get_insights(db: Session = Depends(get_db)):
    """Returns 5-7 genuine analytical findings derived directly from the real dataset."""
    return AnalyticsService.get_dynamic_insights(db)


@router.get("/action-plan")
def get_action_plan(db: Session = Depends(get_db)):
    """Returns a prioritized SOC detection engineering and alert tuning action plan."""
    return AnalyticsService.get_action_plan(db)
