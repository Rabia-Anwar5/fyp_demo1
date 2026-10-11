# CATCH - Contextual Automated Tracking, Comparison and Hub for Coupons

> **Final Year Project (Capstone) | University**
> A retail shopping assistant for physical mall shoppers powered by computer vision, real-time scraping, and agentic deal discovery.

## Quick Start (Docker - one command)

```bash
cp infra/.env.example infra/.env   # fill in secrets
docker compose -f infra/docker-compose.yml up --build
```

Services:
| Service | URL |
|---|---|
| AI Service (FastAPI) | http://localhost:8000 |
| Logic Service (Node) | http://localhost:3001 |
| Mongo Express (dev UI) | http://localhost:8081 |

## Repository Layout

```
catch/
  README.md
  docs/           - architecture, API spec, dataset card, eval report
  mobile/         - React Native + Expo (Android / iOS)
  extension/      - Chrome MV3 extension
  ai-service/     - FastAPI: YOLOv8 + MobileNetV3 + OpenCV fabric
  logic-service/  - Node.js: discount engine, FCM, merchant API
  scrapers/       - Puppeteer + BS4 jobs, mock data, connectors
  ml/             - Dataset tooling, training scripts, notebooks
  infra/          - docker-compose, env templates, CI configs
  tests/          - e2e and integration test suites
```

## Known Proposal Issues (corrected)

1. Citation error: The proposal cited YOLOv9 as "Redmon & Farhadi, CVPR 2024" - INCORRECT.
   Redmon and Farhadi authored YOLOv1-v3. YOLOv9 is by Wang, Yeh & Liao (2024).
   This project uses YOLOv8 by Ultralytics (Jocher et al.). Please update references.
2. "Scraping POS" replaced with storefront-page scraping + merchant submission API.
3. Virtual try-on is an AR-ready 2D overlay stub.
4. Fabric grade label set: cotton|polyester|denim|wool|blend x standard|premium quality tiers.
5. "Real-time stock" timestamps always returned and displayed.