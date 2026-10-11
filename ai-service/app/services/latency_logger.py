"""
Latency logging for RQ1 instrumentation.
Writes JSONL records to LATENCY_LOG_FILE.
"""
import json
import os
import time
import asyncio
from pathlib import Path
from ..core.config import settings
from ..core.logging import logger

_log_path = Path(settings.LATENCY_LOG_FILE)


def _ensure_log_dir():
    _log_path.parent.mkdir(parents=True, exist_ok=True)


def record_latency(request_id: str, latency: dict, metadata: dict = None):
    """Append a latency record to the JSONL log (non-blocking)."""
    _ensure_log_dir()
    record = {
        "ts": time.time(),
        "request_id": request_id,
        "latency": latency,
        **(metadata or {}),
    }
    try:
        with open(_log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception as e:
        logger.warning("Failed to write latency log", error=str(e))