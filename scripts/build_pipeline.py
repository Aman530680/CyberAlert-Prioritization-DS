"""
CyberAlert-Prioritization: End-to-End Data Pipeline Driver
Executes Ingestion -> Data Quality Validation -> Cleaning -> Feature Engineering -> Noise Scoring -> Parquet Export.
"""

import sys
import logging
from pathlib import Path
import time

# Ensure project root is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.data.validation import run_data_quality_audit
from src.data.cleaning import process_dataset
from src.features.feature_engineering import engineer_features
from src.analysis.noise_analysis import calculate_noise_scores

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("build_pipeline")


def run_full_pipeline(
    raw_path: str = "data/raw/advanced_siem_dataset.jsonl",
    processed_parquet: str = "data/processed/cleaned_alerts.parquet",
    max_records: int | None = None
):
    start_time = time.time()
    logger.info("=" * 60)
    logger.info("CYBERALERT-PRIORITIZATION: DATA PIPELINE INITIATION")
    logger.info("=" * 60)
    
    # 1. Data Quality Audit
    logger.info("Phase 3: Running Data Quality Audit...")
    quality_report = run_data_quality_audit(raw_path)
    logger.info(f"Audit Complete. Score: {quality_report['data_quality_score']}%, Records: {quality_report['total_records']}")
    
    # 2. Cleaning & Standardization
    logger.info("Phase 2: Cleaning and Normalizing Records...")
    cleaned_df = process_dataset(
        raw_file_path=raw_path,
        output_parquet=processed_parquet,
        output_csv=None, # Parquet handles 100k efficiently
        max_records=max_records
    )
    
    # 3. Feature Engineering
    logger.info("Phase 4: Engineering Temporal, Frequency, Velocity, and Interaction Features...")
    feat_df = engineer_features(cleaned_df)
    
    # 4. Noise Scoring Engine
    logger.info("Phase 8: Computing Explainable Noise Scores & Tuning Levels...")
    final_df = calculate_noise_scores(feat_df)
    
    # 5. Overwrite processed parquet with full engineered dataset
    final_path = Path(processed_parquet)
    final_df.to_parquet(final_path, index=False, engine="pyarrow")
    
    elapsed = time.time() - start_time
    logger.info("=" * 60)
    logger.info(f"DATA PIPELINE COMPLETED SUCCESSFULLY in {elapsed:.2f} seconds!")
    logger.info(f"Final Dataset Shape: {final_df.shape}")
    logger.info(f"File Size: {final_path.stat().st_size / (1024*1024):.2f} MB")
    logger.info(f"Incidents: {final_df['is_incident'].sum()} ({final_df['is_incident'].mean()*100:.2f}%)")
    logger.info(f"Noise Levels: {final_df['noise_level'].value_counts().to_dict()}")
    logger.info("=" * 60)
    return final_df


if __name__ == "__main__":
    run_full_pipeline()
