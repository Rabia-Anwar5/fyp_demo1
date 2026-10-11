# CATCH Scrapers

Scheduled scraping and mock data for inventory + promotion aggregation.

## Components

- `src/connectors/storeConnector.ts` - Interface all connectors implement
- `src/connectors/mockConnector.ts`  - Mock connector returning seed JSON (CI/demo)
- `src/jobs/seedLoader.js`           - Seeds MongoDB from mock-data/ JSON files
- `mock-data/seed_coupons.json`      - 5 sample coupons (4 active, 1 expired for filter testing)
- `mock-data/seed_products.json`     - 3 sample products across stores

## Adding a Real Store Connector

1. Create `src/connectors/<storeName>Connector.ts` implementing `StoreConnector`
2. Use Puppeteer for JS-rendered pages or `node-fetch` + cheerio for static
3. Always check `robots.txt` and terms of service before scraping
4. Add source config to `src/connectors/sources.json`

## Seeding the Database

```bash
npm install
MONGODB_URI=mongodb://localhost:27017/catch node src/jobs/seedLoader.js
```

## Legal Note

Only scrape store pages you are authorised to scrape. Prefer merchant submission API
over scraping. Mock data is always available as a fallback for demo/CI.