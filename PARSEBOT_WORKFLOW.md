# ParseBot Workflow — Practical Guide

This guide follows the **Scraping Layer (Multiple Sources)**. ParseBot is a no-code point-and-click scraper. Use it for public directories, then export to Sheets/CSV and import into this CRM.

---

## Step 1 — Target Sites

Decide what to scrape and where:

| Site | Use for |
|------|--------|
| **VConnect** | Gyms, events, retailers |
| **Business List** | Gyms, events |
| **Yellow Pages** | Bars, lounges |
| **Google search** | e.g. "Red Bull distributor Lagos" |
| **Instagram** | Business profiles |

---

## Step 2 — Build ParseBot Scrapers

For each site:

### A. Scrape public directory

1. **Create new scraper** in ParseBot.
2. **Enter category URL** (e.g. gyms in Lagos).
3. **Select business cards** on the page (the repeated block that contains one business).
4. **Extract fields:**
   - Business name  
   - Phone  
   - Address (and area/city if available)
5. **Loop "next page"** so all pages are scraped.
6. **Export** to Google Sheet or CSV.

### B. Repeat for each target

- One scraper per site or per category (e.g. VConnect gyms, VConnect events, Business List gyms, Yellow Pages lounges, etc.).

---

## Step 3 — Export & Consolidate

1. **ParseBot → Sheets**  
   Export runs to Google Sheets (or download CSV).

2. **Google Sheets → Clean / dedupe**  
   - Remove empty rows.  
   - Normalize phone (e.g. 234…).  
   - Deduplicate by phone or name+phone.

3. **Add city labels**  
   - Add a column **city** with values `LAGOS` or `ABUJA` (or map area → city).

4. **Push to CRM**  
   - **Option A:** Use this app's **Imports** page: upload CSV with columns like `name`, `phone`, `email` (optional), `address`, `area`, `city`, `category`.  
   - **Option B:** Keep working in Sheets and only import when ready.

### CSV format for this CRM

For best results, CSV should have:

- `name` (required)
- `phone` (required)
- `email` (optional)
- `address` (optional)
- `area` (optional)
- `city` — `LAGOS` or `ABUJA`
- `category` — one of: `GYM`, `EVENT_CENTER`, `CLUB`, `LOUNGE`, `OFFICE`, `SMALL_RETAILER`, `OTHER`

---

## Step 4 — Enrich & Verify (Optional, Later)

1. **Follow website links**  
   From Sheets or from CRM leads, open business websites.

2. **Extract email with ParseBot**  
   - Scrape "Contact us" or "About" pages.  
   - Or paste page content into this app's **Email / phone extractors** (Scrapers page, section 5).

3. **Use regex enrichment**  
   - Paste scraped HTML or text into **Email / phone extractors**.  
   - Click **Extract emails & phones**, then **Add as leads** (choose city/category).  
   - Same flow for any source (ParseBot, Firecrawl, manual copy-paste).

---

## Flow Summary

| Step | What you do |
|------|-------------|
| **1** | Pick target sites (VConnect, Business List, Yellow Pages, Google, Instagram). |
| **2** | In ParseBot: create scraper per site/category → enter URL → select cards → extract name/phone/address → loop next page → export to Sheets/CSV. |
| **3** | In Sheets: clean, dedupe, add city → Import via this CRM's **Imports** (CSV) or keep in Sheets. |
| **4** | (Optional) Enrich: follow links, scrape contact pages, use **Email / phone extractors** for regex extraction and "Add as leads". |

---

## How this fits the Scraping Layer

- **ParseBot** = no-code scraper; its **flow** is: target sites → build scrapers → export to Sheets/CSV → import to CRM.  
- **Pattern:** Export to Sheets/CSV, then use this CRM's **Imports** and/or **Email / phone extractors** so all scrapers follow the same "consolidate → enrich" pattern.

For the full list of sources (Axiom, Playwright, Firecrawl, Apify, Email/Phone extractors, ParseBot), open the **Scrapers** page in this app.
