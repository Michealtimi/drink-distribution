# Implementation Notes - Phase 2 & 3

## Installation Steps

After pulling the code, run:

```bash
# Install dependencies
pnpm install

# Install Playwright browsers (required for scraping)
npx playwright install chromium

# Generate Prisma client with new schema
pnpm db:generate

# Push schema changes to database
pnpm db:push
```

## New Features

### Phase 2: Lead Scraping
- **Scrapers**: Google Maps, Instagram, Business Directory
- **Bulk Import**: `/api/leads/bulk` endpoint
- **Scraping UI**: `/scrapers` page to manage scraping jobs
- **Auto-deduplication**: Prevents duplicate leads

### Phase 3: Automation & Analytics
- **Follow-up Automation**: `/api/cron/follow-ups` endpoint (can be called by Vercel cron)
- **Route Planning**: Full CRUD for delivery routes
- **Analytics Dashboard**: Key metrics and charts
- **Order Detail Page**: Complete order management with payment tracking

## Important Notes

### Playwright
- Playwright requires browser binaries to be installed
- Run `npx playwright install chromium` after `pnpm install`
- Scrapers use headless mode for performance

### Cron Jobs
- For Vercel: Add cron configuration to `vercel.json`
- For local/server: Use `node-cron` (already included)
- Follow-up automation generates messages but does NOT auto-send (manual per master prompt)

### Scraping Ethics
- All scrapers include rate limiting (2 second delays by default)
- Respects robots.txt (implemented in base scraper)
- Slow, respectful scraping to avoid overwhelming servers

### Database
- New `ScrapingJob` model added to schema
- Run `pnpm db:push` to update database

## API Endpoints Added

### Phase 2
- `POST /api/leads/bulk` - Bulk import leads
- `POST /api/scrapers/run` - Start scraping job
- `GET /api/scrapers/status/[jobId]` - Get job status
- `GET /api/scrapers/history` - Get job history

### Phase 3
- `GET /api/cron/follow-ups` - Process follow-ups (cron endpoint)
- `GET /api/routes` - List routes
- `POST /api/routes` - Create route
- `GET /api/routes/[id]` - Get route details
- `PATCH /api/routes/[id]` - Update route
- `DELETE /api/routes/[id]` - Delete route
- `POST /api/routes/[id]/customers` - Add customer to route
- `DELETE /api/routes/[id]/customers` - Remove customer from route
- `POST /api/routes/[id]/reorder` - Reorder customers
- `GET /api/analytics/overview` - Get analytics data
- `GET /api/orders/[id]` - Get order details
- `PATCH /api/orders/[id]` - Update order
- `POST /api/orders/[id]/payments` - Add payment to order

## Testing

1. **Test Scrapers**: Start a scraping job from `/scrapers` page
2. **Test Routes**: Create a route and add customers
3. **Test Analytics**: View dashboard at `/analytics`
4. **Test Orders**: View order details and add payments

## Known Limitations

- Instagram scraper requires public profiles (may need login for private)
- Directory scraper uses generic selectors (may need customization per directory)
- Google Maps scraper may need adjustments if Google changes their HTML structure
