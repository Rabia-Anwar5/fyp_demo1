# CATCH System Architecture

## Three-Tier Hybrid Edge-Cloud Design

### Tier 1 - Edge (Mobile + Extension)
- React Native + Expo for Android/iOS
- Camera capture with on-device: blur detection, size checks, JPEG compression (target ~200KB)
- Chrome MV3 Extension: content script scans DOM for product images/prices
- Both clients call ai-service over HTTPS

### Tier 2 - Cloud Inference (ai-service: FastAPI, Python)
- Receives compressed images
- YOLOv8 for object detection and category recognition (bounding boxes, confidence)
- MobileNetV3 for lightweight feature extraction / classification
- OpenCV fabric texture analysis: LBP, GLCM, Gabor, FFT features -> fabric classifier
- Confidence threshold: >= 0.7 = positive ID; < 0.7 = "uncertain, please retake"
- Returns: {category, bounding_box, confidence, fabric_type?, fabric_quality?, item_context_id}

### Tier 3 - Logic & Proactive Layer (logic-service: Node.js + MongoDB)
- Discount filtering engine: parse, deduplicate, expire-check, category-map, rank by net_saving
- Agentic coupon matcher: triggered by ai-service result, finds best deal without user query
- FCM push notification trigger via Firebase Admin SDK
- Merchant submission API: stores submit inventory + markdowns directly
- MongoDB collections: products, stores, coupons, scrape_cache, user_profiles, notifications_log, analytics

### Scrapers (cron jobs, Node.js Puppeteer + Python BS4)
- Scheduled background scraping of configured local store storefronts
- Connector interface designed for future real POS integration
- Normalize into unified schema; store with last_updated timestamp
- Respect robots.txt; never scrape restricted or unauthorized sources
- Mock/seed data provided so demo never requires live third-party sites

## API Contracts

See docs/api_spec.md for full OpenAPI reference.

Key endpoints:
  POST /api/v1/recognize       - ai-service: image -> recognition result
  POST /api/v1/deals           - logic-service: item_context -> ranked deals
  POST /api/v1/notify          - logic-service: trigger FCM push
  POST /api/v1/merchant/submit - logic-service: merchant inventory submission
  GET  /api/v1/scraper/health  - scrapers health status

## Data Flow (happy path)

1. User captures image on phone
2. Mobile compresses + encodes frame, POSTs to ai-service /recognize
3. ai-service runs YOLOv8 + MobileNetV3 + fabric analysis
4. If confidence >= 0.7: ai-service internally calls logic-service /deals
5. logic-service queries MongoDB (cached scrape + merchant data), runs discount engine
6. Returns top-N ranked deals with net_saving, expiry, reason
7. logic-service triggers FCM push notification to user device
8. Mobile receives push + shows deal overlay

## Performance Targets

- p50 end-to-end latency: < 3s on mid-range phone over WiFi
- p95 end-to-end latency: < 6s
- Scrape freshness: configurable per store (default 30min)
- Confidence threshold: 0.7 (configurable in ai-service config)