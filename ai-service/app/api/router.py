"""Aggregates all API routes."""
from fastapi import APIRouter
from .routes import recognize, health

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(recognize.router, tags=["Recognition"])