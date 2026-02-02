# Audit & Strategy – Sales Distribution (FMCG Beverage CRM)

## Purpose

This document summarizes the current state of the system after the internal scraper and UX fixes, and gives a clear path for running and evolving the app.

---

## What Was Fixed

### Scraper & lead pipeline
- **Lead deduplication**: Leads without a phone no longer all collapse into one (empty string no longer matches every lead). Dedup uses name + area when phone is missing.
- **Finelib scraper**: Uses correct Finelib URLs (`/cities/{city}/{category}`) and a query→category mapping (e.g. gym → fitness, event center → recreation).
- **Directory scraper**: Aligned with Finelib city/category structure instead of a broken external directory.
- **Placeholder phones**: All scrapers and `scraper-manager` use empty string for missing phones (no more `2340000000000`), so dedup and CRM data stay clean.
- **Scraper run API**: Single `query` and multiple `queries` are parsed reliably; the manager always receives a non-empty list of search terms.
- **Scrapers UI**: Simplified to feature only the internal Playwright scrapers; external/optional scraper sections removed to reduce confusion.

### Build & types
- **Analytics overview**: Replaced Prisma enum imports with string literals to avoid client/schema sync issues.
- **Leads message route**: `generateMessage` is awaited so the WhatsApp link gets a string, not a Promise; same fix in follow-up processor.
- **Extract-contacts**: Explicit types for map callbacks.
- **Scrapers (directory/finelib)**: Element typing fixes for `nextElementSibling` assignments.

### Security & config
- **.gitignore**: `.env` and `.env*.local` are ignored (no secrets in repo).
- **.env.example**: Placeholders only; `CRON_SECRET` and `AXIOM_API_KEY` documented as optional. No real secrets.
- **Cron**: `/api/cron/follow-ups` checks `CRON_SECRET` when set (Bearer token). Safe to enable in production by setting `CRON_SECRET`.

### Convenience
- **Playwright**: `playwright:install` / `pw` and `pw:check` scripts added; `.env.example` and `INTERNAL_SCRAPERS.md` document setup and usage.

---

## Auth & Middleware (Production)

- **Current behaviour**: Middleware allows all requests (personal CRM, no auth).
- **Cron**: Protected when `CRON_SECRET` is set; caller must send `Authorization: Bearer <CRON_SECRET>`.
- **For production**: To protect the app and API:
  1. Add auth (e.g. NextAuth, Clerk, or simple session/password).
  2. In `middleware.ts`, require auth for `/api/*` (except public/cron paths) and for dashboard routes (e.g. `/`, `/leads`, `/customers`, `/orders`, etc.).
  3. Keep `/api/cron/follow-ups` protected only by `CRON_SECRET` (no session).

Until you add auth, treat the app as internal-only (e.g. not exposed to the public internet or use a firewall/VPN).

---

## How to Run

```bash
# Install dependencies (use pnpm if you use it)
pnpm install

# Install Playwright Chromium for internal scrapers
pnpm pw
# or: pnpm playwright:install

# Verify Playwright
pnpm pw:check

# Database
cp .env.example .env
# Edit .env: set DATABASE_URL (and CRON_SECRET in production)

pnpm prisma generate
pnpm db:push

# Dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Scrapers** to run internal Playwright scrapers (see `INTERNAL_SCRAPERS.md` for queries and cities).

---

## Strategy Going Forward

1. **Scraping**: Rely on internal Playwright scrapers (Finelib, directory, etc.). Add new sources by extending the scraper manager and mapping queries to the right URLs/selectors.
2. **Leads**: Keep strict dedup and empty-string-for-missing-phone so leads and follow-ups stay accurate.
3. **Credit discipline**: Keep messaging and docs aligned with “trial = pay after delivery (max 48h)”, no soft credit.
4. **Auth**: Before going live, add auth and protect API + dashboard in middleware as above.
5. **Design**: Use the new CSS variables in `globals.css` for colors, radius, and spacing so the UI stays consistent and easy to theme.
