# CATCH AI Service

FastAPI service providing YOLOv8 product detection, MobileNetV3 feature extraction, and OpenCV fabric texture analysis.

## Quick Start

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
# Docs at http://localhost:8000/docs
```

## Running Tests

```bash
pytest tests/ -v
```

## Model Weights

Place trained weights in `ml/weights/`:
- `yolov8_catch.pt` - custom YOLOv8 weights (from ml/ training)
- `mobilenet_catch.pt` - custom MobileNetV3 weights
- `fabric_classifier.pkl` - sklearn fabric classifier

If weights are missing, the service uses YOLOv8n (auto-downloaded) and threshold rules for fabric.

## Key Endpoints

- `POST /api/v1/recognize` - product recognition
- `GET  /api/v1/health`    - service health + model status
- `GET  /docs`             - OpenAPI interactive docs

## Confidence Threshold

Default: 0.70 (configurable via `CONFIDENCE_THRESHOLD` env var).
Below threshold: status=uncertain, caller should prompt user for retake.