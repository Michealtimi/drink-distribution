# Beverage Distribution Automation System

A zero-budget CRM system for FMCG beverage distribution in Lagos and Abuja.

## Business Focus

- **Products**: Red Bull, Alternative energy drink, Cognac (optional: bottled water)
- **Customers**: Gyms, Event centers, Clubs & lounges, Offices, Small retailers
- **Cities**: Lagos, Abuja

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API routes
- **Database**: PostgreSQL (Supabase / Railway free tier)
- **ORM**: Prisma
- **Scraping**: Playwright / Cheerio (Phase 2)
- **Cron**: node-cron / Vercel cron (Phase 3)

## Setup

1. **Install dependencies** (pnpm recommended):
   ```bash
   pnpm install
   ```

2. **Install Playwright Chromium** (for internal scrapers):
   ```bash
   pnpm pw
   ```
   Verify: `pnpm pw:check`

3. **Set up database**:
   - Create a PostgreSQL database (Supabase or Railway free tier)
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` in `.env`

4. **Initialize database**:
   ```bash
   pnpm prisma generate
   pnpm db push
   ```

5. **Run development server**:
   ```bash
   pnpm dev
   ```

See **AUDIT_AND_STRATEGY.md** for a full audit and run commands. See **INTERNAL_SCRAPERS.md** for scraper usage.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── leads/             # Leads management pages
│   ├── customers/         # Customer management pages
│   └── orders/            # Order management pages
├── components/            # React components
├── lib/                   # Utilities, message generator
├── prisma/                # Prisma schema
└── .cursor/rules/         # Cursor AI rules
```

## Phases

### Phase 1 (Current)
- ✅ Database schema
- ✅ CRM UI foundation
- 🔄 Manual lead entry
- 🔄 Message generator

### Phase 2
- Lead scrapers (Google Maps, Instagram, directories)
- Auto lead import
- Deduplication

### Phase 3
- Follow-up automation
- Route planning UI
- Basic analytics

## Key Principles

- **Credit discipline**: Trial = pay after delivery (max 48h)
- **No soft credit**: Business is NOT a lender
- **Route-based**: Group by area and delivery day
- **Human messaging**: No buzzwords, no emojis, operationally credible

## Legal Note

Scraping must be:
- Slow and respectful
- From public pages only
- Respect robots.txt
- Avoid heavy traffic
# drink-distribution
