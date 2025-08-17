# Backend Assessment – Website Analysis API

A minimal, production-ready Express API that scrapes and analyzes website pages, persists results in Supabase, and can optionally enhance copy via Google Gemini. Includes Swagger docs, validation with Zod, basic rate limiting, and clean modular structure.

## Tech Stack
- Express, CORS, Morgan, express-rate-limit
- Supabase (Postgres) via `@supabase/supabase-js`
- Scraping: Cheerio (HTML), Puppeteer (JS-rendered pages when needed)
- Validation: Zod
- API Docs: Swagger (swagger-jsdoc + swagger-ui-express)
- Optional AI: Google Gemini (`@google/generative-ai`)

## Project Structure
```
src/
  app.js                 # App wiring, middleware, /docs, /health
  server.js              # Bootstraps env + starts server
  routes/website.routes.js
  controllers/website.controller.js
  services/
    scraper.service.js   # Cheerio/Puppeteer scraping helpers
    ai.service.js        # Optional Gemini enhancer
  middlewares/
    validate.middleware.js
    error.middleware.js
  config/supabase.js     # Supabase client
  utils/urlValidator.js
schema.sql               # Postgres table for websites
.env.example             # Configuration template
```

## Quick Start
1. Clone and install
```bash
npm install
```
2. Configure environment
- Copy `.env.example` to `.env` and fill values
```
PORT=8080
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_or_service_key
SUPABASE_SCHEMA=public
SUPABASE_TABLE=websites
AI_ENABLED=true            # or false
GEMINI_API_KEY=            # required only if AI_ENABLED=true
```
3. Prepare database (Supabase/Postgres)
- Run the SQL in `schema.sql` to create the `websites` table

4. Run
```bash
# Dev (with nodemon)
npm run dev
# Prod
npm start
```

- Health check: `GET /health`
- Swagger docs: `GET /docs`
- Default local base URL: `http://localhost:8080`

## API
Base path: `/api`

### POST /websites
Scrape and store a website record. Optionally enhances description using Gemini if `AI_ENABLED=true` and key is set.

Request body
```json
{
  "url": "https://example.com",
  "useAI": true
}
```
Response (201)
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "brand_name": "Example",
  "description": "Raw scraped description...",
  "enhanced_description": "Concise, improved copy...",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

cURL
```bash
curl -X POST http://localhost:8080/api/websites \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","useAI":true}'
```

### GET /websites
List websites (sorted by creation time in controller).

Response (200)
```json
[
  {
    "id": "uuid",
    "url": "https://example.com",
    "brand_name": "Example",
    "description": "...",
    "enhanced_description": "...",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### GET /websites/:id
Fetch a single website by ID.

### PUT /websites/:id
Update a website. Sending a new `url` may trigger re-scrape.

Request body (example)
```json
{
  "url": "https://new-domain.com",
  "useAI": false
}
```

### DELETE /websites/:id
Delete a website by ID.

## Notes on Scraping and AI
- `src/services/scraper.service.js` uses Cheerio for fast static HTML parsing and may fall back to Puppeteer for JS-rendered pages.
- `src/services/ai.service.js` enhances description only when:
  - `AI_ENABLED=true` AND `GEMINI_API_KEY` is provided; otherwise it silently skips.

## Validation and Errors
- Zod-based request validation via `validate.middleware.js` guards controllers.
- Centralized error handling in `error.middleware.js` returns structured JSON errors.
- Basic rate limiting: 60 req/min/IP.

## Supabase Setup
- Configure URL and Key in `.env`.
- Table name defaults via `SUPABASE_TABLE` (see `.env.example`).
- Run `schema.sql` in your Supabase SQL editor or Postgres.

## Development Tips
- Edit Swagger input paths in `src/app.js` if you add route files.
- Check logs with Morgan in dev.
- Use `/docs` for quick testing, or the cURL snippets above.
