# CATCH Logic Service

Node.js + Express + MongoDB service providing:
- Dynamic discount filtering engine (pure TypeScript, fully tested)
- Agentic coupon matching triggered by AI recognition results
- Firebase Cloud Messaging push notifications
- Merchant inventory submission API
- Analytics logging for RQ3/RQ4 instrumentation

## Quick Start

```bash
cd logic-service
npm install
cp .env.example .env   # configure MONGODB_URI, etc.
npm run dev
```

## Running Tests

```bash
npm test
```

## Key Endpoints

- `POST /api/v1/deals`            - get ranked deals for a recognised item
- `POST /api/v1/notify`           - trigger FCM push notification
- `POST /api/v1/merchant/submit`  - merchant inventory + promo submission
- `GET  /api/v1/analytics/summary`- deal discovery and scraper metrics
- `GET  /api/v1/health`           - service health

## Discount Engine

Pure TypeScript, zero IO - see `src/services/discountEngine.ts`.
Filter order: expiry → category → fabric → min_spend → net_saving rank.
All edge cases are covered by unit tests in `tests/discountEngine.test.ts`.