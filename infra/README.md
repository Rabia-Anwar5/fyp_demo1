# CATCH Infrastructure

## One-command startup

```bash
cd infra
cp .env.example .env   # fill in any secrets
docker compose up --build
```

This starts:
- MongoDB (port 27017)
- Mongo Express UI (port 8081, admin/catchdev)
- AI Service - FastAPI (port 8000, docs at /docs)
- Logic Service - Node.js (port 3001)
- Seed job (one-shot, loads mock coupons + products)

## Without Docker

1. Start MongoDB locally
2. `cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload`
3. `cd logic-service && npm install && npm run dev`
4. `cd scrapers && MONGODB_URI=... node src/jobs/seedLoader.js`

## Health Checks

- http://localhost:8000/api/v1/health  (AI Service)
- http://localhost:3001/api/v1/health  (Logic Service)