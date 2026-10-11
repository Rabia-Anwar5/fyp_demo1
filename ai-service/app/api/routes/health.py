"""GET /api/v1/health - service health check."""
from fastapi import APIRouter
from ...services.detection_service import get_models_status, get_uptime
from ...core.config import settings
from ...models.schemas import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    status = get_models_status()
    return HealthResponse(
        status="healthy" if all(status.values()) else "degraded",
        version=settings.APP_VERSION,
        models_loaded=status,
        uptime_seconds=round(get_uptime(), 2),
    )