import os
from pydantic import Field

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel
    class BaseSettings(BaseModel):
        def __init__(self, **values):
            super().__init__(**values)
            for field in self.__annotations__:
                env_val = os.getenv(field)
                if env_val is not None:
                    setattr(self, field, env_val)

class Settings(BaseSettings):
    # Service
    APP_NAME: str = "CATCH AI Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ML
    CONFIDENCE_THRESHOLD: float = 0.70
    YOLO_WEIGHTS: str = "ai-service/ml/weights/yolov8_catch.pt"
    YOLO_FALLBACK_WEIGHTS: str = "yolov8n.pt"   # Ultralytics default, auto-download
    MOBILENET_WEIGHTS: str = "ai-service/ml/weights/mobilenet_catch.pt"
    FABRIC_MODEL_WEIGHTS: str = "ai-service/ml/weights/fabric_classifier.pkl"
    FABRIC_THRESHOLDS: str = "ml/configs/fabric_thresholds.yaml"
    DEVICE: str = "cpu"   # "cuda" if GPU available

    # Downstream services
    LOGIC_SERVICE_URL: str = "http://logic-service:3001"
    LOGIC_SERVICE_TIMEOUT: int = 10

    # Security
    API_KEY_HEADER: str = "X-API-Key"
    API_KEY: str = Field(default="dev-insecure-key", env="AI_SERVICE_API_KEY")

    # Logging
    LOG_LEVEL: str = "INFO"
    LATENCY_LOG_FILE: str = "logs/latency.jsonl"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()