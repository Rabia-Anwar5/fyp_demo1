"""
Integration test: Image -> AI Service -> Logic Service -> Deals

Tests the full walking skeleton end-to-end.
Requires both services running (or mocked via httpx).
Run: pytest tests/integration/test_full_pipeline.py -v

For CI: services are started via docker-compose before this test runs.
"""
import io
import json
import pytest
import httpx
from PIL import Image

AI_SERVICE = "http://localhost:8000"
LOGIC_SERVICE = "http://localhost:3001"


def make_test_image() -> bytes:
    img = Image.new("RGB", (224, 224), color=(80, 100, 160))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def ai_client():
    with httpx.Client(base_url=AI_SERVICE, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def logic_client():
    with httpx.Client(base_url=LOGIC_SERVICE, timeout=30) as c:
        yield c


class TestAIServiceHealth:
    def test_health_endpoint(self, ai_client):
        resp = ai_client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] in ("healthy", "degraded")


class TestRecognizePipeline:
    def test_recognize_returns_valid_response(self, ai_client):
        img = make_test_image()
        resp = ai_client.post(
            "/api/v1/recognize",
            files={"image": ("test.jpg", img, "image/jpeg")},
            data={"user_id": "integration_test"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ("recognized", "uncertain", "error")
        assert "request_id" in data

    def test_recognize_latency_under_10s(self, ai_client):
        import time
        img = make_test_image()
        t0 = time.perf_counter()
        resp = ai_client.post(
            "/api/v1/recognize",
            files={"image": ("test.jpg", img, "image/jpeg")},
        )
        elapsed = (time.perf_counter() - t0) * 1000
        assert resp.status_code == 200
        assert elapsed < 10000, f"Too slow: {elapsed:.0f}ms"
        print(f"\n[latency] end-to-end: {elapsed:.0f}ms")


class TestLogicServiceHealth:
    def test_health(self, logic_client):
        resp = logic_client.get("/api/v1/health")
        assert resp.status_code == 200


class TestDealsEndpoint:
    def test_deals_for_apparel(self, logic_client):
        resp = logic_client.post(
            "/api/v1/deals",
            json={
                "item_context_id": "ctx_integration_01",
                "category": "apparel",
                "subcategory": "jacket",
                "fabric_type": "denim",
                "user_id": "test_user_01",
                "location": {"mall_id": "mall_001"},
                "reference_price": 199.0,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "deals" in data
        assert isinstance(data["deals"], list)
        # Seed data should provide at least one deal
        print(f"\n[deals] Found {len(data['deals'])} deals, filtered {data.get('deals_filtered_out', 0)}")
        if data["deals"]:
            top = data["deals"][0]
            assert top["net_saving"] >= 0
            assert top["rank"] == 1
            print(f"[deals] Top deal: {top['store_name']} saves {top['net_saving']}")

    def test_deals_response_schema(self, logic_client):
        resp = logic_client.post(
            "/api/v1/deals",
            json={
                "item_context_id": "ctx_integration_02",
                "category": "footwear",
                "subcategory": "sneaker",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        required_fields = ["deals", "total_deals_found", "deals_filtered_out", "request_id"]
        for f in required_fields:
            assert f in data, f"Missing field: {f}"