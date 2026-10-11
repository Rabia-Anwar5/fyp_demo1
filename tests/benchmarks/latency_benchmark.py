"""
Latency Benchmark Script (RQ1)

Measures p50/p95 end-to-end latency for:
1. Image upload -> recognition (ai-service)
2. Recognition -> deals (logic-service)
3. Total time-to-deal

Usage:
  python tests/benchmarks/latency_benchmark.py --runs 50 --concurrency 1

Output: JSON summary + JSONL log for analysis
"""
import argparse
import asyncio
import io
import json
import statistics
import time
from pathlib import Path

import httpx
from PIL import Image

AI_SERVICE = "http://localhost:8000"
LOGIC_SERVICE = "http://localhost:3001"
OUTPUT_FILE = Path("tests/benchmarks/results/latency_results.jsonl")


def make_test_image(size=(224, 224)) -> bytes:
    img = Image.new("RGB", size, color=(100, 130, 160))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


async def run_one(client: httpx.AsyncClient, img_bytes: bytes, run_id: int) -> dict:
    t0 = time.perf_counter()

    # Step 1: AI recognition
    t_ai_start = time.perf_counter()
    resp = await client.post(
        f"{AI_SERVICE}/api/v1/recognize",
        files={"image": ("test.jpg", img_bytes, "image/jpeg")},
        data={"user_id": "benchmark_user"},
    )
    t_ai_end = time.perf_counter()
    ai_data = resp.json()
    ai_ms = (t_ai_end - t_ai_start) * 1000

    # Step 2: Deal lookup (if recognized)
    deal_ms = 0.0
    deals_count = 0
    if ai_data.get("status") == "recognized":
        t_d_start = time.perf_counter()
        dresp = await client.post(
            f"{LOGIC_SERVICE}/api/v1/deals",
            json={
                "item_context_id": ai_data.get("item_context_id", "ctx_bench"),
                "category": ai_data.get("category", "apparel"),
                "subcategory": ai_data.get("subcategory", "jacket"),
                "user_id": "benchmark_user",
            },
        )
        t_d_end = time.perf_counter()
        deal_ms = (t_d_end - t_d_start) * 1000
        deals_count = len(dresp.json().get("deals", []))

    total_ms = (time.perf_counter() - t0) * 1000

    record = {
        "run_id": run_id,
        "status": ai_data.get("status"),
        "confidence": ai_data.get("confidence"),
        "ai_ms": round(ai_ms, 2),
        "deal_ms": round(deal_ms, 2),
        "total_ms": round(total_ms, 2),
        "deals_count": deals_count,
        "ts": time.time(),
    }
    print(f"  Run {run_id:3d}: total={total_ms:.0f}ms ai={ai_ms:.0f}ms deal={deal_ms:.0f}ms deals={deals_count}")
    return record


async def benchmark(runs: int = 50, concurrency: int = 1):
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    img_bytes = make_test_image()

    results = []
    async with httpx.AsyncClient(timeout=30) as client:
        sem = asyncio.Semaphore(concurrency)
        async def run_with_sem(i):
            async with sem:
                return await run_one(client, img_bytes, i)

        tasks = [run_with_sem(i) for i in range(runs)]
        results = await asyncio.gather(*tasks)

    # Write JSONL
    with open(OUTPUT_FILE, "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")

    # Statistics
    total_times = [r["total_ms"] for r in results]
    ai_times = [r["ai_ms"] for r in results]

    def pct(lst, p):
        lst_s = sorted(lst)
        idx = int(len(lst_s) * p / 100)
        return lst_s[min(idx, len(lst_s)-1)]

    summary = {
        "runs": runs,
        "p50_total_ms": pct(total_times, 50),
        "p95_total_ms": pct(total_times, 95),
        "mean_total_ms": statistics.mean(total_times),
        "p50_ai_ms": pct(ai_times, 50),
        "p95_ai_ms": pct(ai_times, 95),
    }

    print("\n=== Benchmark Summary ===")
    for k, v in summary.items():
        print(f"  {k}: {v}")
    print(f"\nResults written to: {OUTPUT_FILE}")
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=50)
    parser.add_argument("--concurrency", type=int, default=1)
    args = parser.parse_args()
    asyncio.run(benchmark(args.runs, args.concurrency))