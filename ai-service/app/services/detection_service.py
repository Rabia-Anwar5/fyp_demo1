"""
YOLOv8 + MobileNetV3 detection service.

Production: loads weights from YOLO_WEIGHTS / MOBILENET_WEIGHTS env.
Fallback: uses YOLOv8n (auto-downloaded by Ultralytics) so the service
always starts, even without custom weights.

Category-to-superclass mapping used to determine if fabric analysis applies.
"""
import time
import uuid
import logging
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

from ..core.config import settings
from ..core.logging import logger

# Deferred heavy imports (torch/ultralytics) so startup is fast when mocking
_yolo_model = None
_mobilenet_model = None
_models_loaded = {"yolo": False, "mobilenet": False}
_startup_time = time.time()

APPAREL_SUBCATEGORIES = {"jacket", "shirt", "pants", "dress"}
FOOTWEAR_SUBCATEGORIES = {"sneaker", "formal_shoe"}
ACCESSORIES_SUBCATEGORIES = {"bag", "watch", "sunglasses"}
ELECTRONICS_SUBCATEGORIES = {"electronics"}

CATEGORY_MAP = {
    **{k: "apparel" for k in APPAREL_SUBCATEGORIES},
    **{k: "footwear" for k in FOOTWEAR_SUBCATEGORIES},
    **{k: "accessories" for k in ACCESSORIES_SUBCATEGORIES},
    **{k: "electronics" for k in ELECTRONICS_SUBCATEGORIES},
}

YOLO_CLASS_NAMES = [
    "jacket", "shirt", "pants", "dress",
    "sneaker", "formal_shoe", "bag", "watch",
    "sunglasses", "electronics"
]


def _load_yolo():
    global _yolo_model, _models_loaded
    try:
        from ultralytics import YOLO
        weights_path = Path(settings.YOLO_WEIGHTS)
        if weights_path.exists():
            _yolo_model = YOLO(str(weights_path))
            logger.info("Loaded custom YOLO weights", path=str(weights_path))
        else:
            logger.warning("Custom YOLO weights not found, using fallback", path=str(weights_path))
            _yolo_model = YOLO(settings.YOLO_FALLBACK_WEIGHTS)
            logger.info("Loaded fallback YOLO weights", weights=settings.YOLO_FALLBACK_WEIGHTS)
        _models_loaded["yolo"] = True
    except Exception as e:
        logger.error("Failed to load YOLO model", error=str(e))
        _models_loaded["yolo"] = False


def _load_mobilenet():
    global _mobilenet_model, _models_loaded
    try:
        import torch
        import torchvision.models as tv_models
        weights_path = Path(settings.MOBILENET_WEIGHTS)
        if weights_path.exists():
            _mobilenet_model = torch.load(str(weights_path), map_location=settings.DEVICE)
            logger.info("Loaded custom MobileNetV3 weights")
        else:
            logger.warning("Custom MobileNetV3 weights not found, loading pretrained")
            _mobilenet_model = tv_models.mobilenet_v3_small(weights=tv_models.MobileNet_V3_Small_Weights.DEFAULT)
        _mobilenet_model.eval()
        _models_loaded["mobilenet"] = True
    except Exception as e:
        logger.error("Failed to load MobileNetV3", error=str(e))
        _models_loaded["mobilenet"] = False


def load_all_models():
    """Called at application startup."""
    _load_yolo()
    _load_mobilenet()


def get_models_status() -> dict:
    return dict(_models_loaded)


def get_uptime() -> float:
    return time.time() - _startup_time


async def run_detection(image: Image.Image, request_id: str) -> dict:
    """
    Run full detection pipeline.
    Returns a dict with keys matching RecognitionResponse schema.
    """
    t0 = time.perf_counter()

    # --- Preprocess ---
    img_array = np.array(image.convert("RGB"))
    t_pre = time.perf_counter()

    # --- YOLO inference ---
    best_box = None
    best_conf = 0.0
    best_label = "unknown"
    yolo_boxes = []

    if _yolo_model is not None:
        try:
            results = _yolo_model.predict(
                source=img_array,
                conf=0.25,   # raw threshold; we filter at 0.7 after
                verbose=False,
                device=settings.DEVICE,
            )
            t_yolo = time.perf_counter()
            for r in results:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    label = YOLO_CLASS_NAMES[cls_id] if cls_id < len(YOLO_CLASS_NAMES) else "unknown"
                    xyxyn = box.xyxyn[0].tolist()
                    yolo_boxes.append({
                        "x1": xyxyn[0], "y1": xyxyn[1],
                        "x2": xyxyn[2], "y2": xyxyn[3],
                        "label": label, "conf": round(conf, 4)
                    })
                    if conf > best_conf:
                        best_conf = conf
                        best_label = label
                        best_box = yolo_boxes[-1]
        except Exception as e:
            logger.error("YOLO inference error", request_id=request_id, error=str(e))
            t_yolo = time.perf_counter()
    else:
        # Mock fallback for testing without models
        t_yolo = time.perf_counter()
        best_conf = 0.85
        best_label = "jacket"
        best_box = {"x1": 0.1, "y1": 0.1, "x2": 0.9, "y2": 0.9, "label": "jacket", "conf": 0.85}
        yolo_boxes = [best_box]
        logger.warning("YOLO model not loaded, using mock result", request_id=request_id)

    t_yolo_done = time.perf_counter()

    # --- MobileNetV3 feature extraction (stub for walking skeleton) ---
    # In production: extract features and run lightweight subcategory classifier
    t_mobilenet_done = time.perf_counter()

    # --- Confidence gate ---
    if best_conf < settings.CONFIDENCE_THRESHOLD:
        t_total = time.perf_counter()
        return {
            "request_id": request_id,
            "status": "uncertain",
            "message": f"Confidence {best_conf:.2f} below threshold {settings.CONFIDENCE_THRESHOLD}. Please retake image.",
            "confidence": round(best_conf, 4),
            "latency": _latency(t0, t_pre, t_yolo, t_yolo_done, t_mobilenet_done, t_total),
        }

    # --- Category resolution ---
    category = CATEGORY_MAP.get(best_label, "unknown")
    item_context_id = f"ctx_{request_id[:8]}"

    t_post = time.perf_counter()

    return {
        "request_id": request_id,
        "status": "recognized",
        "category": category,
        "subcategory": best_label,
        "confidence": round(best_conf, 4),
        "bounding_boxes": yolo_boxes,
        "item_context_id": item_context_id,
        "latency": _latency(t0, t_pre, t_yolo, t_yolo_done, t_mobilenet_done, t_post),
    }


def _latency(t0, t_pre, t_yolo, t_yolo_done, t_mobilenet_done, t_total):
    ms = lambda a, b: round((b - a) * 1000, 2)
    return {
        "total_ms": ms(t0, t_total),
        "preprocess_ms": ms(t0, t_pre),
        "yolo_ms": ms(t_pre, t_yolo_done),
        "mobilenet_ms": ms(t_yolo_done, t_mobilenet_done),
        "fabric_ms": 0.0,
        "postprocess_ms": ms(t_mobilenet_done, t_total),
    }