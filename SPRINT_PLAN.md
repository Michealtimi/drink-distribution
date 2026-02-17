# Sprint Plan — Production Readiness

Prioritized roadmap (P0 → P3) with clear tasks and acceptance criteria. Use this to track what’s done and what’s next.

---

## Sprint 1 — P0: Production gate

**Goal:** Safe to call “production” for single-user: auth documented, order numbers atomic, critical paths tested, DB workflow clear.

| # | Task | Acceptance criteria | Status |
|---|------|---------------------|--------|
| 1 | **Auth** | When `DASHBOARD_PIN` is set, middleware protects all routes (pages + API). Only `/login`, `/api/auth/*`, `/api/cron/*` are public. Document in SETUP.md. | ✅ Doc |
| 2 | **Order number** | Order numbers are atomic (`ORD-{timestamp}-{random}`). No shared counter; safe under concurrent POSTs. Comment in code + doc here. | ✅ Done |
| 3 | **Integration tests** | Vitest tests for: POST create lead (validation + success), GET leads list (shape + limit). Optional: GET lead by id. | ✅ Tests |
| 4 | **DB + Prisma** | After any `schema.prisma` change, run `pnpm db:push` and `pnpm prisma generate`. Document in SETUP.md “After schema changes” section. | ✅ Doc |

**Definition of done:** SETUP mentions auth and DB workflow; order number commented in code; leads API tests pass; no duplicate API route folders.

---

## Sprint 2 — P1: Short term

**Goal:** Better observability, consistent validation, clean routes.

| # | Task | Acceptance criteria | Status |
|---|------|---------------------|--------|
| 5 | **Structured logger** | `lib/logger.ts` with `requestId` / `jobId` support. Use in at least: leads GET/POST, scraper job start/end. | ✅ Logger |
| 6 | **List limits** | Businesses and customers use `parseListLimit` (default 100, max 500). Already true; add one-line comment in route or doc. | ✅ Verified |
| 7 | **Route cleanup** | Single `app/api/leads/[id]/` folder. If you see a duplicate `[id ]` (with space) in your file tree, delete that folder and its contents manually. | ✅ Doc |
| 8 | **Validation audit** | All public API inputs validated with Zod; errors via api-errors. Confirmed: leads, orders, scrapers/run, suppliers, templates, businesses use Zod + api-errors. | ✅ Done |

---

## Sprint 3 — P2: Medium term

| # | Task | Notes |
|---|------|--------|
| 9 | Dedup perf | Preload (name, area, city) into Set for run, or batch duplicate checks; or document limits. |
| 10 | Background job logging | Log WhatsApp + scraper failures with leadId/jobId; optional retry/alert. |
| 11 | Refactors | Service/repository layer; split ScraperManager; split Leads page. |

---

## Sprint 4 — P3: As needed

| # | Task |
|---|------|
| 12 | Product: “Today’s route” export, stock alerts, payment reminders, conversion reports. |
| 13 | Security: HSTS/CSP, Axiom webhook auth, `pnpm audit`. |

---

## Reference: Order number

- **File:** `app/api/orders/route.ts`
- **Format:** `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
- **Why safe:** No shared counter; timestamp + random prevents collisions under concurrent creates. Schema has `orderNumber @unique` as backstop.

---

## Reference: DB workflow (after schema changes)

1. Edit `prisma/schema.prisma`.
2. Run:
   ```bash
   pnpm db:push
   pnpm prisma generate
   ```
3. Restart dev server if needed.

With migrations: `pnpm db:migrate` then `pnpm prisma generate`.

---

## Manual cleanup (if needed)

- **Duplicate lead route:** If your repo has both `app/api/leads/[id]/` and `app/api/leads/[id ]/` (with a space), delete the `[id ]` folder and its files so only one dynamic route exists.
