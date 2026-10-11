"""Pydantic schemas for AI Service API."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class ItemCategory(str, Enum):
    apparel = "apparel"
    electronics = "electronics"
    footwear = "footwear"
    accessories = "accessories"
    unknown = "unknown"

class FabricType(str, Enum):
    cotton = "cotton"
    polyester = "polyester"
    denim = "denim"
    wool = "wool"
    blend = "blend"

class QualityTier(str, Enum):
    standard = "standard"
    premium = "premium"

class RecognitionStatus(str, Enum):
    recognized = "recognized"
    uncertain = "uncertain"
    error = "error"

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    label: str
    conf: float

class FabricResult(BaseModel):
    type: Optional[FabricType] = None
    quality_tier: Optional[QualityTier] = None
    confidence: Optional[float] = None
    features: Optional[Dict[str, float]] = None

class LatencyBreakdown(BaseModel):
    total_ms: float
    preprocess_ms: float
    yolo_ms: float
    mobilenet_ms: float
    fabric_ms: float
    postprocess_ms: float

class RecognitionResponse(BaseModel):
    request_id: str
    status: RecognitionStatus
    message: Optional[str] = None
    category: Optional[ItemCategory] = None
    subcategory: Optional[str] = None
    confidence: Optional[float] = None
    bounding_boxes: Optional[List[BoundingBox]] = None
    fabric: Optional[FabricResult] = None
    item_context_id: Optional[str] = None
    latency: Optional[LatencyBreakdown] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: Dict[str, bool]
    uptime_seconds: float