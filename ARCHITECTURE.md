# Sales Distribution — Architecture (One Page)

## Data flow

```
Scraper (Playwright) → ScrapedLead[] → Dedup (phone Set + DB) → Batch import (createMany)
       → Lead (SCRAPED) → Validate → Lead (VERIFIED/INVALID) → Message → Follow-ups
       → Customer → Order → Payment → Route
```

## Main modules

| Module | Responsibility |
|--------|----------------|
| **ScraperManager** (`lib/scrapers/scraper-manager.ts`) | Creates job, runs scraper(s), calls dedup + import pipeline + auto-validate, updates job status. |
| **Lead deduplicator** (`lib/lead-deduplicator.ts`) | `loadExistingPhones(cities?)` → Set; `deduplicateLeads(leads, existingPhones?)` → unique + duplicates. Phone check O(1) when Set provided. |
| **Lead import pipeline** (`lib/lead-import-pipeline.ts`) | `batchImportLeads(leads, source)` for scraped leads; `batchImportLeadRecords(records, existingPhones, existingEmails)` for CSV/from-contacts. Uses createMany in chunks (200). |
| **Lead validator** (`lib/lead-validator.ts`) | `validateLead(id)`, `validateLeadsBatch(ids)`, `autoValidateScrapedLeads()`. Updates status to VERIFIED/UNVERIFIED/INVALID. |
| **Message generator** (`lib/message-generator.ts`) | `generateMessage(status, context)` → `{ content, fromTemplate }`. DB template or fallback; `fromTemplate` for visibility. |
| **Follow-up scheduler** (`lib/follow-up-scheduler.ts`) | `scheduleFollowUpsForLead(leadId)` (Day 2, Day 5, month-end); `getPendingFollowUpsForToday()`, `getOverdueFollowUps()`. |
| **Follow-up processor** (`lib/cron/follow-up-processor.ts`) | Cron: fetches pending/overdue, generates message per follow-up, updates FollowUp.message, returns results (no auto-send). |
| **API errors** (`lib/api-errors.ts`) | Structured responses: `badRequest`, `conflict`, `internalError`, `serviceUnavailable`, `timeout` with optional `code`. |

## How to add a new scraper

1. Create a class in `lib/scrapers/` extending `BaseScraper`, implementing `scrape(query: string): Promise<ScrapedLead[]>`.
2. In `prisma/schema.prisma`, add a value to enum `ScraperType` if needed.
3. In `lib/scrapers/scraper-manager.ts`, add a case in `getScraper()` that returns your scraper instance, and in `getSourceName()` return the display name.
4. Run job via `POST /api/scrapers/run` with `{ type, query, city?, category? }`.

## How lead creation works

- **Scraper job**: ScraperManager → deduplicateLeads (with pre-loaded phone Set) → batchImportLeads (createMany chunks) → autoValidateScrapedLeads.
- **CSV / from-contacts**: One query for existing phones/emails, build Sets, filter records, then batchImportLeadRecords (createMany chunks).
- **Single lead (POST /api/leads)**: Zod-validated body, duplicate check by phone/email, one create.

## API conventions

- **List endpoints**: Return `{ data, nextCursor?, limit }` for pagination (e.g. GET /api/leads with `limit`, `cursor`).
- **Errors**: Use `lib/api-errors` for consistent `{ error, code?, message?, details? }` and status codes.
- **Validation**: Use Zod for POST/PUT bodies and enum checks (e.g. leads POST).

## Database

- **Prisma** for all access; no raw SQL except analytics aggregations (orders by month, revenue by city).
- **Indexes** on Lead: phone, email, status, city, businessId. Use exact match or indexed fields where possible; avoid unbounded findMany.

## Scaling notes

- Dedup: pre-load phones with `loadExistingPhones(cities)` so phone check is O(1) per lead.
- Import: always batch (createMany in chunks of 200).
- Analytics: aggregate in DB (groupBy / raw SQL); no “load all orders” in memory.
