"""
CyberAlert-Prioritization: Feature Engineering Pipeline
Constructs domain-specific cybersecurity features:
- Time Features: hour, day, day_of_week, day_of_month, month, week_of_year, weekend, business_hours, night_time
- Frequency Features: alert_count_per_hour, alert_count_per_day, source_alert_frequency, system_alert_frequency, alert_type_frequency
- Repetition Features: repeated_alert_count, same_source_repetition, same_system_repetition, same_type_repetition, time_since_previous_similar_alert, alert_burst_score
- Severity Features: encoded_severity, severity_weight, severity_frequency
- Interaction Features: source_alert_type, system_alert_type, severity_alert_type, source_system

Designed specifically to avoid target leakage while extracting maximum predictive signal.
"""

import logging
from pathlib import Path
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("features")


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies comprehensive feature engineering transformations on cleaned alert DataFrame.
    Assumes df is chronologically sorted by timestamp.
    """
    logger.info(f"Starting feature engineering on {len(df)} records...")
    df = df.copy()
    
    # Ensure timestamp is datetime
    if not pd.api.types.is_datetime64_any_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        
    df.sort_values(by="timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)
    
    # =========================================================================
    # 1. TIME FEATURES
    # =========================================================================
    # Cyber threats frequently exhibit diurnal periodicity and off-hours stealth activity
    df["hour"] = df["timestamp"].dt.hour
    df["day"] = df["timestamp"].dt.day
    df["day_of_week"] = df["timestamp"].dt.dayofweek # 0=Monday, 6=Sunday
    df["day_of_month"] = df["timestamp"].dt.day
    df["month"] = df["timestamp"].dt.month
    df["week_of_year"] = df["timestamp"].dt.isocalendar().week.astype(int)
    
    # Weekend indicator (Saturday or Sunday)
    df["weekend"] = df["day_of_week"].apply(lambda d: 1 if d >= 5 else 0)
    
    # Standard SOC business hours: 08:00 to 18:00 on weekdays
    df["business_hours"] = (
        (df["hour"] >= 8) & (df["hour"] < 18) & (df["weekend"] == 0)
    ).astype(int)
    
    # Night-time off-hours window: 22:00 to 06:00
    df["night_time"] = ((df["hour"] >= 22) | (df["hour"] < 6)).astype(int)
    
    # Sine/Cosine cyclical encodings for continuous time representation
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
    df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)
    
    # =========================================================================
    # 2. FREQUENCY & VELOCITY FEATURES
    # =========================================================================
    # Aggregating volume signals across time windows without future leakage
    df["date_hour_key"] = df["timestamp"].dt.strftime("%Y-%m-%d %H:00")
    df["date_day_key"] = df["timestamp"].dt.strftime("%Y-%m-%d")
    
    # Alert volume counts per time bucket
    hour_counts = df["date_hour_key"].value_counts()
    day_counts = df["date_day_key"].value_counts()
    df["alert_count_per_hour"] = df["date_hour_key"].map(hour_counts).fillna(1).astype(int)
    df["alert_count_per_day"] = df["date_day_key"].map(day_counts).fillna(1).astype(int)
    
    # Relative global frequencies of entities (normalized 0 to 1)
    n_total = len(df)
    source_counts = df["source"].value_counts()
    system_counts = df["affected_system"].value_counts()
    type_counts = df["alert_type"].value_counts()
    
    df["source_alert_frequency"] = df["source"].map(source_counts) / n_total
    df["system_alert_frequency"] = df["affected_system"].map(system_counts) / n_total
    df["alert_type_frequency"] = df["alert_type"].map(type_counts) / n_total
    
    # =========================================================================
    # 3. REPETITION & BURST FEATURES
    # =========================================================================
    # Repetition signals: Repeated low-severity alerts indicate benign noise or scanning
    # High bursts over short intervals indicate DDoS or brute force
    df["same_source_repetition"] = df.groupby("source").cumcount() + 1
    df["same_system_repetition"] = df.groupby("affected_system").cumcount() + 1
    df["same_type_repetition"] = df.groupby("alert_type").cumcount() + 1
    
    # Group by (source, alert_type, affected_system) for exact triplet repetition
    df["triplet_key"] = df["source"] + "||" + df["alert_type"] + "||" + df["affected_system"]
    df["repeated_alert_count"] = df.groupby("triplet_key").cumcount() + 1
    
    # Time delta since previous alert of same type (in seconds)
    df["prev_type_timestamp"] = df.groupby("alert_type")["timestamp"].shift(1)
    df["time_since_previous_similar_alert"] = (
        (df["timestamp"] - df["prev_type_timestamp"]).dt.total_seconds().fillna(86400)
    )
    # Clip large intervals to 86,400s (24 hours)
    df["time_since_previous_similar_alert"] = df["time_since_previous_similar_alert"].clip(lower=0, upper=86400)
    
    # Alert burst score: High frequency within small time interval (log-scale)
    # Burst score increases when time since previous similar alert is very small
    df["alert_burst_score"] = np.where(
        df["time_since_previous_similar_alert"] <= 60,
        3.0,
        np.where(
            df["time_since_previous_similar_alert"] <= 300,
            2.0,
            np.where(df["time_since_previous_similar_alert"] <= 1800, 1.0, 0.0)
        )
    )
    
    # =========================================================================
    # 4. SEVERITY ENCODINGS & WEIGHTS
    # =========================================================================
    severity_order_map = {
        "info": 0,
        "low": 1,
        "medium": 2,
        "high": 3,
        "critical": 4,
        "emergency": 5
    }
    df["encoded_severity"] = df["severity"].map(severity_order_map).fillna(2).astype(int)
    
    # Severity weight multipliers (exponential scaling for high/critical)
    sev_weights = {0: 0.1, 1: 0.3, 2: 0.6, 3: 1.2, 4: 2.5, 5: 4.0}
    df["severity_weight"] = df["encoded_severity"].map(sev_weights)
    
    # Severity frequency
    sev_freq = df["severity"].value_counts() / n_total
    df["severity_frequency"] = df["severity"].map(sev_freq)
    
    # =========================================================================
    # 5. INTERACTION FEATURES
    # =========================================================================
    df["source_alert_type"] = df["source"] + " | " + df["alert_type"]
    df["system_alert_type"] = df["asset_category"] + " | " + df["alert_type"]
    df["severity_alert_type"] = df["severity"] + " | " + df["alert_type"]
    df["source_system"] = df["source"] + " | " + df["asset_category"]
    
    # Clean up temporary calculation columns
    df.drop(columns=["date_hour_key", "date_day_key", "triplet_key", "prev_type_timestamp"], inplace=True)
    
    logger.info(f"Engineered {len(df.columns)} total feature columns.")
    return df


if __name__ == "__main__":
    from src.data.cleaning import clean_single_record
    from src.data.ingestion import stream_jsonl
    
    records = [clean_single_record(r) for r in stream_jsonl("data/raw/advanced_siem_dataset.jsonl", max_records=2000)]
    df_sample = pd.DataFrame(records)
    feat_df = engineer_features(df_sample)
    print("Features engineered successfully! Shape:", feat_df.shape)
    print(feat_df[["alert_id", "hour", "business_hours", "alert_burst_score", "repeated_alert_count", "severity_weight"]].head())
