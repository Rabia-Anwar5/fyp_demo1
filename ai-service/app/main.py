"""
CATCH AI Service - FastAPI application entry point.
Manages model loading at startup and mounts all routes.
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.logging import setup_logging, logger
from .api.router import api_router
from .services import detection_service, fabric_service

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models at startup, clean up at shutdown."""
    logger.info("CATCH AI Service starting", version=settings.APP_VERSION)
    detection_service.load_all_models()
    fabric_service.load_fabric_model()
    logger.info("Model loading complete", models=detection_service.get_models_status())
    yield
    logger.info("CATCH AI Service shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Computer vision inference service for retail product recognition and fabric analysis.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", include_in_schema=False)
async def root():
    return {"service": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}