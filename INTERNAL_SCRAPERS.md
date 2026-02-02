# Internal Web Scrapers — Goal and Steps

## Goal

Get **leads** (gyms, event centers, clubs, lounges, offices, small retailers) in **Lagos** or **Abuja** into the **Leads** list so you can message and convert them. Use **internal scrapers only** — no Axiom or Apify required.

## How It Works

1. **Internal scrapers** (Playwright) run on your machine: Finelib, Directory, Google Maps, BusinessList, Instagram, Facebook.
2. You pick one or more scrapers, enter a **query** (e.g. `gym`, `event center`, `lounge`), choose **city** (Lagos/Abuja), then click **Start**.
3. Jobs run in the background. Results are **deduplicated** and **imported** into Leads; optional **auto-validation** runs on imported leads.
4. You use **Leads** and **Follow-ups** to message and convert.

## Step-by-Step (First Time)

1. **Setup**
   - `pnpm install`
   - `npx playwright install chromium`
   - Set `DATABASE_URL` in `.env` and run `pnpm db:push` if needed.

2. **Run a scrape**
   - Go to **Scrapers** in the app.
   - Under **Internal scrapers**: select **Finelib** and/or **Directory** (most reliable for Nigeria).
   - Query: e.g. `gym` or `event center` or `lounge`.
   - City: **Lagos** or **Abuja**.
   - Click **Start**.

3. **Check results**
   - **Job history** (same page): status, leads found, leads imported.
   - **Leads** page: new leads with status Scraped → then Unverified/Verified after auto-validation.

4. **If 0 leads**
   - Run `npx playwright install chromium` again.
   - Try **Finelib** or **Directory** with query `gym` and city Lagos — they use real Finelib.com category URLs.

## What Was Fixed

- **Finelib scraper**: Uses real Finelib URLs (`/cities/lagos/health/fitness-and-gym` etc.) and parses listing links + address/phone from the page.
- **Directory scraper**: Uses the same Finelib city/category URLs (no broken `nigerianbusinessdirectory.com`).
- **Deduplication**: Leads without a phone no longer collapse into one duplicate; they’re deduped by name/area only.
- **Missing phone**: All scrapers use empty string for missing phone (no placeholder); DB and deduplication handle it.
- **Run API**: Accepts `query` or `queries` as string or array (including comma/newline-separated string).
- **Scrapers page**: Internal scrapers are first and clearly recommended; Axiom and others are optional below.

## Recommended Queries (Sales Distribution)

- `gym` — fitness centres
- `event center` or `event centre` — venues
- `lounge` or `club` — clubs and lounges
- `office` or `business` — offices
- `retail` or `shop` — small retailers

Use **Finelib** and **Directory** for predictable results; **Google Maps** when you need broader search (e.g. “gyms Victoria Island”).
