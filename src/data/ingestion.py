"""
CyberAlert-Prioritization: Raw Data Ingestion Module
Streams and reads the raw advanced_siem_dataset.jsonl file with robust schema handling.
"""

import json
import logging
from pathlib import Path
from typing import Generator, Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ingestion")


def stream_jsonl(file_path: str | Path, max_records: int | None = None) -> Generator[Dict[str, Any], None, None]:
    """
    Generator that streams JSON lines from raw dataset efficiently without loading entire file into memory.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Raw dataset not found at: {path.resolve()}")

    logger.info(f"Streaming raw JSONL dataset from: {path.resolve()}")
    count = 0
    with open(path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                yield record
                count += 1
                if max_records and count >= max_records:
                    break
            except json.JSONDecodeError as e:
                logger.warning(f"Malformed JSON on line {line_num}: {e}")
                continue

    logger.info(f"Completed streaming {count} records from {path.name}.")


def load_raw_dataset(file_path: str | Path, max_records: int | None = None) -> List[Dict[str, Any]]:
    """
    Loads raw dataset records into a list.
    """
    return list(stream_jsonl(file_path, max_records=max_records))


if __name__ == "__main__":
    records = load_raw_dataset("data/raw/advanced_siem_dataset.jsonl", max_records=5)
    print(f"Loaded {len(records)} test records. Sample ID: {records[0].get('event_id')}")
