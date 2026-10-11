# CATCH API Specification v1.0

## AI Service (FastAPI) - Base URL: http://localhost:8000

### POST /api/v1/recognize
Accepts an image and returns recognition results.

Request (multipart/form-data):
  image: file (JPEG/PNG, max 5MB)
  user_id: string (optional, for analytics)
  location: { lat: float, lng: float } (optional JSON string)

Response 200:
```json
{
  "request_id": "uuid",
  "status": "recognized" | "uncertain" | "error",
  "category": "apparel" | "electronics" | "footwear" | "accessories" | "unknown",
  "subcategory": "jacket" | "shirt" | "sneaker" | ...,
  "confidence": 0.87,
  "bounding_boxes": [{ "x1": 0.1, "y1": 0.2, "x2": 0.6, "y2": 0.9, "label": "jacket", "conf": 0.87 }],
  "fabric": {
    "type": "denim" | "cotton" | "polyester" | "wool" | "blend" | null,
    "quality_tier": "standard" | "premium" | null,
    "confidence": 0.75,
    "features": { "lbp_contrast": 0.42, "glcm_energy": 0.31 }
  },
  "item_context_id": "ctx_abc123",
  "latency_ms": { "total": 1240, "yolo": 320, "mobilenet": 180, "fabric": 90 }
}
```

Response 200 (uncertain):
```json
{ "status": "uncertain", "message": "Confidence 0.52 below threshold 0.7. Please retake image.", "confidence": 0.52 }
```

### GET /api/v1/health
Returns service health and model status.

---

## Logic Service (Node.js) - Base URL: http://localhost:3001

### POST /api/v1/deals
Given a recognised item context, return ranked deals.

Request:
```json
{
  "item_context_id": "ctx_abc123",
  "category": "apparel",
  "subcategory": "jacket",
  "fabric_type": "denim",
  "user_id": "user_xyz",
  "location": { "lat": 3.1412, "lng": 101.6865, "mall_id": "mall_001" }
}
```

Response 200:
```json
{
  "deals": [
    {
      "deal_id": "deal_001",
      "store_name": "Denim Republic",
      "store_id": "store_042",
      "original_price": 199.00,
      "discounted_price": 139.30,
      "net_saving": 59.70,
      "saving_percent": 30.0,
      "coupon_code": "DENIM30",
      "expiry": "2026-12-31T23:59:59Z",
      "terms": "Min spend RM150. Excludes sale items.",
      "category_match": true,
      "rank": 1,
      "why_top": "Highest net saving (30%) with no minimum spend conflict",
      "stock_status": "in_stock",
      "last_updated": "2026-10-11T08:00:00Z"
    }
  ],
  "total_deals_found": 5,
  "deals_filtered_out": 3,
  "filter_reasons": ["expired: 2", "category_mismatch: 1"],
  "request_id": "uuid"
}
```

### POST /api/v1/notify
Trigger FCM push notification.

Request:
```json
{
  "user_id": "user_xyz",
  "fcm_token": "device_token",
  "deal_id": "deal_001",
  "title": "30% off that jacket!",
  "body": "Denim Republic: use DENIM30 for RM59 saving"
}
```

### POST /api/v1/merchant/submit
Merchant inventory and markdown submission.

Request:
```json
{
  "merchant_id": "merch_001",
  "api_key": "sk_...",
  "products": [
    {
      "sku": "DR-JKT-001",
      "name": "Classic Denim Jacket",
      "category": "apparel",
      "subcategory": "jacket",
      "original_price": 199.00,
      "stock_qty": 24,
      "store_id": "store_042",
      "promotions": [
        {
          "coupon_code": "DENIM30",
          "discount_type": "percent",
          "discount_value": 30,
          "min_spend": 0,
          "expiry": "2026-12-31T23:59:59Z",
          "terms": "Excludes sale items"
        }
      ]
    }
  ]
}
```

### GET /api/v1/scraper/health
Returns per-source scraper status, last run time, error counts.

### GET /api/v1/analytics/summary
Returns match-rate, avg time-to-deal, top categories (for RQ3/RQ4 instrumentation).