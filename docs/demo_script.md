# CATCH Demo Script (5-minute walkthrough)

## Setup (before demo)
1. `docker compose -f infra/docker-compose.yml up -d` (start all services)
2. Open extension in Chrome (load unpacked: extension/)
3. Mobile: `npx expo start`, scan QR
4. Confirm: http://localhost:8000/docs loads, http://localhost:3001/api/v1/health returns healthy

---

## Scene 1: In-store scanning (2 min)

**Presenter:** "I am standing in a mall looking at a denim jacket priced at RM199."

1. Open CATCH app on phone → Camera screen
2. Point camera at jacket (or use a test image of a jacket)
3. Tap capture button
4. Show AI processing → "APPAREL · jacket · 87% confident"
5. Show fabric badge: "DENIM · Standard"
6. Show deals overlay: "BEST DEAL: 30% off at Denim Republic — Save RM59.70, use code DENIM30"

**Key points:**
- No manual search — proactive, triggered by camera
- Confidence displayed (> 0.7 threshold)
- Fabric type detected without special hardware
- Deal shows expiry and why it won

---

## Scene 2: Push notification (30 sec)

1. (Pre-arranged) Trigger a manual FCM push via:
   `POST http://localhost:3001/api/v1/notify` with test payload
2. Phone shows push notification: "30% off at Denim Republic!"
3. Tap notification → opens deal screen directly

---

## Scene 3: Chrome Extension (1.5 min)

1. Browse to a mock e-commerce page (or use provided test HTML)
2. Show extension icon → "1 deal found"
3. Show floating overlay with CATCH panel
4. Show coupon code copy: "FASHION15 - copied!"
5. Click "Virtual Try-On" → AR placeholder stub
6. Explain: "Full AR try-on is roadmapped for M6; stub is AR-ready"

---

## Scene 4: Merchant submission (30 sec)

1. Open API docs: http://localhost:8000/docs
2. Show `POST /api/v1/merchant/submit`
3. Paste sample payload and submit → 200 OK
4. Show in Mongo Express (port 8081) that product/coupon was upserted
5. Repeat scan → new deal appears (demonstrates merchant path vs scraper path)

---

## Scene 5: Analytics & Research Questions (30 sec)

1. `GET http://localhost:3001/api/v1/analytics/summary`
2. Show avg_time_to_deal_ms, deals_found, top_saving
3. "We log p50/p95 latency per request in ai-service logs — answering RQ1"
4. "Fabric classification under 3 lighting conditions answers RQ2 — see eval report"

---

## Known Limitations (be upfront)

- Custom YOLOv8 weights not yet trained (team is annotating 500+ images) — fallback is yolov8n
- Fabric grade thresholds are provisional until trained classifier is ready
- Virtual try-on is a clearly-marked stub
- Scraper currently uses mock data; real store scraper connectors added in M3/M4
- FCM requires real Firebase project for device push (stub works in dev)