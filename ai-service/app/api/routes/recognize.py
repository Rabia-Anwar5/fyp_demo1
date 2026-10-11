"""
POST /api/v1/recognize
Main image recognition endpoint.
"""
import uuid
import time
import io
import json
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from PIL import Image

from ...core.config import settings
from ...core.logging import logger
from ...models.schemas import RecognitionResponse, RecognitionStatus
from ...services import detection_service, fabric_service
from ...services.latency_logger import record_latency

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def validate_api_key(x_api_key: str = None):
    """Simple API key check. Replace with OAuth2/JWT for production."""
    # Dev mode: skip validation if key is default
    if settings.API_KEY == "dev-insecure-key":
        return True
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True


@router.post("/recognize", response_model=RecognitionResponse)
async def recognize_image(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(..., description="Product image (JPEG/PNG/WebP, max 5MB)"),
    user_id: Optional[str] = Form(None),
    location: Optional[str] = Form(None),  # JSON string: {"lat":3.1,"lng":101.6,"mall_id":"mall_001"}
):
    """
    Recognise a retail product from an image.

    Returns item category, subcategory, confidence, bounding boxes, and fabric analysis (for apparel).
    Returns status='uncertain' if confidence < threshold (default 0.7) — caller should ask for retake.
    """
    request_id = str(uuid.uuid4())
    log = logger.bind(request_id=request_id, user_id=user_id)
    log.info("Received recognition request", filename=image.filename, content_type=image.content_type)

    # --- Validation ---
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {image.content_type}")

    raw = await image.read()
    if len(raw) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"Image too large: {len(raw)} bytes (max 5MB)")

    try:
        pil_img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot decode image")

    # --- Detection ---
    result = await detection_service.run_detection(pil_img, request_id)

    # --- Fabric analysis (apparel only) ---
    if result.get("status") == "recognized" and result.get("category") == "apparel":
        import numpy as np
        img_arr = np.array(pil_img)
        bbox = result.get("bounding_boxes", [None])[0]
        fabric_result = await fabric_service.analyse_fabric(img_arr, bbox)
        fabric_ms = fabric_result.pop("analysis_ms", 0.0)
        result["fabric"] = fabric_result
        if result.get("latency"):
            result["latency"]["fabric_ms"] = fabric_ms
            result["latency"]["total_ms"] += fabric_ms

    # --- Log latency (background, non-blocking) ---
    loc_data = {}
    if location:
        try:
            loc_data = json.loads(location)
        except Exception:
            pass
    background_tasks.add_task(
        record_latency,
        request_id,
        result.get("latency", {}),
        {"user_id": user_id, "category": result.get("category"), "status": result.get("status"), **loc_data},
    )

    log.info("Recognition complete", status=result.get("status"), confidence=result.get("confidence"))
    return JSONResponse(content=result)