"""Unit and integration tests for the /recognize endpoint."""
import io
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def make_image_bytes(width=200, height=200) -> bytes:
    """Create a small test JPEG in memory."""
    img = Image.new("RGB", (width, height), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_health():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "version" in data


def test_recognize_returns_recognized_or_uncertain():
    img_bytes = make_image_bytes()
    resp = client.post(
        "/api/v1/recognize",
        files={"image": ("test.jpg", img_bytes, "image/jpeg")},
        data={"user_id": "test_user"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("recognized", "uncertain", "error")
    assert "request_id" in data


def test_recognize_rejects_oversized_image():
    big = b"x" * (6 * 1024 * 1024)
    resp = client.post(
        "/api/v1/recognize",
        files={"image": ("big.jpg", big, "image/jpeg")},
    )
    assert resp.status_code == 413


def test_recognize_rejects_wrong_type():
    resp = client.post(
        "/api/v1/recognize",
        files={"image": ("file.txt", b"hello", "text/plain")},
    )
    assert resp.status_code == 400


def test_recognize_with_mock_high_confidence():
    """Force high-confidence detection via mock and verify response shape."""
    mock_result = {
        "request_id": "test-req-1",
        "status": "recognized",
        "category": "apparel",
        "subcategory": "jacket",
        "confidence": 0.92,
        "bounding_boxes": [{"x1": 0.1, "y1": 0.1, "x2": 0.9, "y2": 0.9, "label": "jacket", "conf": 0.92}],
        "item_context_id": "ctx_test01",
        "latency": {"total_ms": 300, "preprocess_ms": 10, "yolo_ms": 200, "mobilenet_ms": 50, "fabric_ms": 0, "postprocess_ms": 40},
    }
    with patch("app.services.detection_service.run_detection", return_value=mock_result):
        img_bytes = make_image_bytes()
        resp = client.post(
            "/api/v1/recognize",
            files={"image": ("jacket.jpg", img_bytes, "image/jpeg")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "recognized"
    assert data["category"] == "apparel"
    assert data["confidence"] >= 0.7


def test_recognize_uncertain_below_threshold():
    mock_result = {
        "request_id": "test-req-2",
        "status": "uncertain",
        "message": "Confidence 0.45 below threshold 0.7. Please retake image.",
        "confidence": 0.45,
        "latency": {"total_ms": 200, "preprocess_ms": 5, "yolo_ms": 180, "mobilenet_ms": 10, "fabric_ms": 0, "postprocess_ms": 5},
    }
    with patch("app.services.detection_service.run_detection", return_value=mock_result):
        img_bytes = make_image_bytes()
        resp = client.post(
            "/api/v1/recognize",
            files={"image": ("blurry.jpg", img_bytes, "image/jpeg")},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "uncertain"
    assert "retake" in data["message"].lower()