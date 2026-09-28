"""
CyberAlert-Prioritization: ML Inference Request & Response Schemas
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    event_id: Optional[str] = "LIVE-API-ALERT"
    timestamp: Optional[str] = None
    event_type: str = Field(default="ids_alert", description="Domain: ids_alert, endpoint, cloud, ai, iot, network, firewall, auth")
    source: str = Field(default="Microsoft Sentinel v1.0.0", description="SIEM or EDR source tool")
    severity: str = Field(default="critical", description="Severity: emergency, critical, high, medium, low, info")
    alert_type: Optional[str] = Field(default="Zero-Day Exploit", description="Alert type or action name")
    category: Optional[str] = Field(default="Exploit", description="Threat category: Exploit, Malware, Recon, Policy, Evasion")
    affected_system: Optional[str] = Field(default="192.168.1.100", description="Target asset identifier")
    asset_category: Optional[str] = Field(default="Target Network Host", description="Asset category")
    alert_burst_score: Optional[float] = Field(default=0.0, description="Burst factor (0 to 3.0)")
    repeated_alert_count: Optional[int] = Field(default=1, description="Previous occurrence count")
    time_since_previous_similar_alert: Optional[float] = Field(default=86400.0, description="Interval in seconds")
    is_anomaly: Optional[bool] = Field(default=False, description="Behavioral anomaly flag")
    baseline_deviation: Optional[float] = Field(default=0.0, description="Baseline deviation score")
    entropy: Optional[float] = Field(default=0.0, description="Entropy score")
    raw_log: Optional[str] = Field(default=None, description="Optional raw CEF string")
    description: Optional[str] = Field(default=None, description="Optional log summary")


class ContributingFeature(BaseModel):
    feature: str
    value: Any
    contribution: float
    direction: str


class PredictResponse(BaseModel):
    alert_id: Optional[str] = "LIVE-ALERT"
    incident_probability: float
    is_incident_predicted: bool
    priority: str
    priority_score: float
    priority_reasons: List[str]
    noise_score: float
    noise_level: str
    severity: str
    explanation: str
    contributing_features: List[ContributingFeature]
