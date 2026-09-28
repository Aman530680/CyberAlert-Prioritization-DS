"""
CyberAlert-Prioritization: SQLAlchemy ORM Models
Defines ORM mappings for alerts, features, model runs, and metrics tables.
"""

from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, Integer, String, Float, Boolean,
    DateTime, TIMESTAMP, Text, JSON, ForeignKey
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class AlertORM(Base):
    __tablename__ = "alerts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    alert_id = Column(String(64), unique=True, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    event_type = Column(String(32), nullable=False)
    source = Column(String(64), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    severity_num = Column(Integer, nullable=False, default=2)
    alert_type = Column(String(64), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)
    affected_system = Column(String(128), nullable=False, index=True)
    asset_category = Column(String(64), nullable=False)
    user_id = Column(String(64), default="N/A")
    src_ip = Column(String(64), default="N/A")
    dst_ip = Column(String(64), default="N/A")
    risk_score = Column(Float, nullable=False, default=50.0)
    confidence = Column(Float, nullable=False, default=0.5)
    geo_location = Column(String(100), default="Unknown")
    is_anomaly = Column(Boolean, nullable=False, default=False)
    mitre_technique = Column(String(32), default="None")
    is_incident = Column(Boolean, nullable=False, default=False, index=True)
    incident_probability = Column(Float, nullable=False, default=0.0)
    noise_score = Column(Float, nullable=False, default=0.0)
    noise_level = Column(String(16), nullable=False, default="LOW", index=True)
    priority = Column(String(16), nullable=False, default="MEDIUM", index=True)
    resolution_status = Column(String(32), nullable=False, default="Open", index=True)
    raw_log = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class AlertFeatureORM(Base):
    __tablename__ = "alert_features"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    alert_id = Column(String(64), unique=True, nullable=False, index=True)
    hour = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    business_hours = Column(Integer, nullable=False)
    night_time = Column(Integer, nullable=False)
    repeated_alert_count = Column(Integer, nullable=False, default=1)
    alert_burst_score = Column(Float, nullable=False, default=0.0)
    time_since_previous_similar_alert = Column(Float, nullable=False, default=86400.0)
    source_alert_frequency = Column(Float, nullable=False, default=0.0)
    system_alert_frequency = Column(Float, nullable=False, default=0.0)
    alert_type_frequency = Column(Float, nullable=False, default=0.0)
    severity_weight = Column(Float, nullable=False, default=1.0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class ModelRunORM(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(64), nullable=False)
    algorithm = Column(String(64), nullable=False)
    n_estimators = Column(Integer, nullable=False)
    max_depth = Column(Integer, nullable=True)
    train_size = Column(Integer, nullable=False)
    test_size = Column(Integer, nullable=False)
    train_accuracy = Column(Float, nullable=False)
    test_accuracy = Column(Float, nullable=False)
    precision_score = Column(Float, nullable=False)
    recall_score = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    pr_auc = Column(Float, nullable=False)
    confusion_matrix = Column(JSON, nullable=False)
    run_timestamp = Column(TIMESTAMP, default=datetime.utcnow)


class ModelMetricORM(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, nullable=False, index=True)
    metric_name = Column(String(64), nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_details = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class DataQualityReportORM(Base):
    __tablename__ = "data_quality_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_date = Column(TIMESTAMP, default=datetime.utcnow)
    total_records = Column(Integer, nullable=False)
    quality_score = Column(Float, nullable=False)
    duplicate_count = Column(Integer, nullable=False)
    invalid_timestamps = Column(Integer, nullable=False)
    metrics_json = Column(JSON, nullable=False)
