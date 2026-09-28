"""
CyberAlert-Prioritization: Pydantic Validation & Serialization Schemas
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AlertBase(BaseModel):
    alert_id: str
    timestamp: datetime
    event_type: str
    source: str
    severity: str
    alert_type: str
    category: str
    affected_system: str
    asset_category: str
    risk_score: float
    confidence: float
    is_anomaly: bool
    is_incident: bool
    incident_probability: float
    noise_score: float
    noise_level: str
    priority: str
    resolution_status: str


class AlertResponse(AlertBase):
    id: int
    user_id: Optional[str] = "N/A"
    src_ip: Optional[str] = "N/A"
    dst_ip: Optional[str] = "N/A"
    geo_location: Optional[str] = "Unknown"
    mitre_technique: Optional[str] = "None"
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AlertDetailResponse(AlertResponse):
    raw_log: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    top_contributing_features: Optional[List[Dict[str, Any]]] = None
    related_alerts_count: int = 0
    historical_incident_rate: float = 0.0


class PaginatedAlertsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[AlertResponse]


class OverviewResponse(BaseModel):
    total_alerts: int
    total_incidents: int
    incident_rate: float
    critical_alerts: int
    high_priority_alerts: int
    high_noise_alerts: int
    model_accuracy: float
    model_roc_auc: float
    data_quality_score: float
    date_range_start: str
    date_range_end: str


class FilterOptionsResponse(BaseModel):
    severities: List[str]
    priorities: List[str]
    alert_types: List[str]
    sources: List[str]
    noise_levels: List[str]
    asset_categories: List[str]
