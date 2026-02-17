# Production-Readiness Audit — 360° Technical Assessment

**Role:** Principal Software Engineer & Technical Auditor  
**Scope:** Full codebase — Architecture, Code Quality, Scalability, Observability, State/Data, Security, Testability, Technical Debt  
**Goal:** Evaluate production-readiness and identify hidden risks.

---

## Single-user / personal CRM

This project is a **single-user personal CRM**. For that use case:

- **Authentication** is intentionally minimal (all routes open); acceptable when the app runs on a trusted machine or behind a firewall. For shared hosting, add auth or restrict by IP.
- **Cron** can be protected with `CRON_SECRET` in `.env` so only your scheduler can trigger follow-ups.
- The **remediation roadmap** below is tuned for “make it better for one user”: data integrity, tests, validation, and logging matter; full multi-tenant auth and horizontal scaling are out of scope unless you later open the app to others.

---

## Fixes applied (personal CRM)

These changes were made to improve the project for single-user use:

| Fix | Description |
|-----|-------------|
| **Order number race** | Order numbers are now `ORD-{timestamp}-{random}` so two concurrent creates cannot get the same number. No schema change. |
| **Scrapers validation** | `POST /api/scrapers/run` uses Zod schema `scraperRunSchema`; validation errors return via `badRequest()`. |
| **Scrapers errors** | Scraper run and history routes use `badRequest`, `internalError`, and `timeout()` from `lib/api-errors.ts` for consistent responses. |
| **Error logging** | WhatsApp welcome failures log `leadId` and `phone`; scraper job failures log `jobId` for easier debugging. |
| **Unit tests** | Vitest added; `lib/phone-utils.test.ts` and `lib/message-generator.test.ts` cover normalization, validation, and message generation. Run with `pnpm test`. |

Run `pnpm install` (if you added Vitest) and `pnpm test` to execute the test suite.

---

## Executive Summary

### Project Health Score: **58 / 100**

| Dimension              | Score (0–100) | Summary |
|------------------------|---------------|--------|
| Architecture & Pattern | 45           | Layered-ish; no service/repository layer; leaky abstractions (Prisma/DB in routes and UI). |
| Code Quality           | 55           | Some DRY (api-errors, Zod schemas, phone-utils); high complexity in large files; mixed naming. |
| Scalability & Perf     | 50           | Batch import is good; dedup can be O(N) DB round-trips; order-number race; no horizontal scaling story. |
| Observability          | 35           | Console-only logging; no request IDs, traces, or metrics; failures can be silent in background jobs. |
| State & Data Integrity | 50           | DB as source of truth is clear; order-number race; fire-and-forget WhatsApp; TOCTOU in concurrent scrapes. |
| Security               | 40           | No auth on API; cron optionally protected; no hardcoded secrets; validation inconsistent (OWASP surface). |
| Testability            | 30           | No tests; logic tightly coupled to Prisma and Next; few pure functions. |
| Technical Debt         | 55           | Documented debt (auth, validation); order-number race; duplicate folder path; no test harness. |

**Verdict:** The system is **usable for a single-tenant, low-user, internal CRM** with a small team. It is **not production-ready** for multi-tenant, high-load, or regulated environments until auth, observability, tests, and critical data-integrity issues are addressed.

---

## The Good, the Bad, and the Ugly

### The Good

- **Structured API errors:** `lib/api-errors.ts` provides consistent codes (BAD_REQUEST, NOT_FOUND, CONFLICT, etc.) and is used in leads, analytics, and several list endpoints.
- **Zod validation where applied:** Leads POST, orders, businesses, templates, suppliers use Zod schemas from `lib/validations/api-schemas.ts`; list endpoints use `parseListLimit` to cap `limit` and avoid unbounded queries.
- **Batch import:** `batchImportLeads` uses `createMany` in chunks (BATCH_SIZE 200), reducing DB round-trips from O(N) to O(N/200); fallback to per-lead create on chunk failure.
- **Dedup design:** `loadExistingPhones()` loads a Set once for O(1) phone lookup during dedup; `deduplicateLeads` accepts this Set to avoid N phone lookups.
- **Cron protection:** `/api/cron/follow-ups` checks `CRON_SECRET` when set; no auth when unset (documented).
- **No hardcoded secrets:** Credentials and secrets are read from `process.env`; `.env` is gitignored.
- **Prisma singleton and shutdown:** Single Prisma instance with `$disconnect` on SIGINT/SIGTERM; connection errors logged without crashing.
- **Scraper history timeout:** GET `/api/scrapers/history` uses Promise.race with 18s timeout and returns 503 on timeout with a clear message.
- **Clear folder layout:** `app/` (pages + API), `lib/` (shared logic), `prisma/` (schema); Next.js App Router conventions followed.

### The Bad

- **No authentication:** Middleware passes all requests; every API route and page is open. Comment states “personal CRM, all routes open” and “For production: add auth.”
- **Inconsistent validation:** Scrapers run route accepts `body` without Zod; some routes use api-errors, others return ad-hoc `NextResponse.json({ error: ... })`. Validation is not a single contract.
- **Leaky abstractions:** API routes and UI depend on Prisma types and enums (e.g. `LeadStatus`, `CustomerType`); no repository or domain layer. Changing DB or domain rules touches many files.
- **Dedup scalability:** `findDuplicateLead` is called per lead; when phone is not in `existingPhones` it does 1–3 `findFirst` calls (phone, name+area, name). So dedup is O(N) DB round-trips in worst case for large batches.
- **Order number race:** `orderNumber = ORD-${orderCount + 1}` is non-atomic; two concurrent POSTs can get the same count and duplicate order numbers (schema has `orderNumber @unique` so one will fail at insert).
- **Observability:** Only `console.log`/`console.error`; no structured logger, request/correlation IDs, or metrics. Background jobs (WhatsApp welcome, scraper) fail only to console.
- **Single points of failure:** One DB; one Node process. Scraper runs in-process; if the process dies, running jobs are lost. No circuit breaker or retry policy on DB calls.
- **Heavy components:** Leads page has 15+ useState, multiple useEffects, and large handlers in one file (~650+ lines); high cognitive load and harder to test.

### The Ugly

- **Zero automated tests:** No unit, integration, or e2e tests; no test script in package.json. Regressions and refactors are not guarded.
- **Login page is a no-op:** `/login` redirects to `/` with no actual auth; misleading for anyone expecting a real login.
- **Duplicate route path:** `app/api/leads/[id\ ]/` (with space) and `app/api/leads/[id]/` both exist; fragile and confusing.
- **Tight coupling:** Business logic (e.g. “create lead then optionally send WhatsApp”) lives in route handlers; `ScraperManager` orchestrates scrapers, DB, dedup, import, and validation in one class. Extracting and testing rules in isolation would require large mocks.
- **Silent background failures:** WhatsApp welcome and scraper job errors only log; no alerting, no dead-letter queue, no retry. Users may assume success when a message was never sent.

---

## 1. Architecture & Pattern Compliance

**Pattern:** **Layered (weak).** Presentation (app/) → API (app/api/) → Shared lib (lib/) → Prisma. No Hexagonal/Clean: no domain layer, no ports/adapters, no repository abstraction.

**Leaky abstractions:**

- **DB in routes and UI:** Routes build `where`/`data` from request and call `prisma.*` directly. Pages and API both rely on Prisma enums and shapes. Changing persistence or domain rules requires edits across routes and lib.
- **ScraperManager as god object:** Creates jobs, runs scrapers, calls `loadExistingPhones`, `deduplicateLeads`, `importFromScrape`, `autoValidateScrapedLeads`, updates job status. No interfaces for “lead repository” or “scraper”; hard to substitute or test in isolation.

**Recommendation:** Introduce a thin service layer (e.g. `LeadService`, `OrderService`) and use Prisma only inside repositories or the service layer; keep routes as HTTP-only. Extract scraper orchestration behind an interface so implementations can be swapped or mocked.

---

## 2. Code Quality & Maintainability

**Cyclomatic complexity:** High in `app/leads/page.tsx` (many branches and state) and in `app/api/scrapers/run/route.ts` (query/type parsing and validation in one handler). ScraperManager’s `executeScrapingJob` has nested loops and multiple error paths.

**DRY:** Good in api-errors, api-schemas, phone-utils, message-generator (shared first/follow-up messages). Some duplication remains (e.g. category/status display names only partly centralized in `lib/constants/display-names.ts`). Scraper run route does manual validation instead of reusing a Zod schema.

**Naming & cognitive load:** Naming is generally clear (`batchImportLeads`, `loadExistingPhones`, `findDuplicateLead`). Cognitive load is high in the Leads page and in ScraperManager because one place does too much; splitting into smaller components and functions would help.

---

## 3. Scalability & Performance

**O(N²) or N round-trips:**

- **Deduplication:** `deduplicateLeads` iterates leads and calls `findDuplicateLead` per lead. With `existingPhones` set, phone check is O(1), but name/area/name similarity still do up to 2 `findFirst` per lead → O(N) DB round-trips. For 10k leads this is 10k–20k queries unless batched or done in-memory with a preloaded set of (name, area, city).
- **Follow-up processor:** Processes follow-ups sequentially; acceptable for moderate volume but does not scale out.

**Re-renders / front-end:** Leads page fetches on filter/sort change and holds 500 leads; filtering is client-side. No obvious memory leaks; large lists are not virtualized.

**Blocking I/O:** Scraper runs in the same Node process; long-running Playwright work can tie up the process. History endpoint uses a timeout so the client gets 503 instead of hanging forever.

**Single points of failure:** Database is the main SPOF. At 10x load, DB connection pool and query latency become the bottleneck; no read replicas or caching. One Node process means scrapers and API compete for the same CPU/memory.

---

## 4. Operational Observability

**Logging:** Only `console.log` / `console.error` / `console.warn`. No log levels, no structured fields (e.g. `requestId`, `jobId`, `userId`). No correlation from browser → API → DB.

**Error handling:** Many routes catch, log, and return 500 with a generic message. api-errors is used in part of the API; scrapers/run returns custom JSON. No global error boundary or error taxonomy.

**Breadcrumb trail:** If a critical failure occurs in production (e.g. scraper job fails, WhatsApp send fails), there is no guaranteed breadcrumb: only console output. No telemetry, no alerts, no central log aggregation. The system can fail silently for background work.

**Recommendation:** Add a structured logger (e.g. pino) with request/job IDs; log at key points (request start/end, DB call, job start/end). Optionally add a small metrics endpoint (e.g. job counts, last run) and integrate with an APM or log aggregator for production.

---

## 5. State Management & Data Integrity

**Source of truth:** Database (Prisma) is the single source of truth for leads, orders, customers, jobs. No conflicting client-side authority.

**Race conditions:**

- **Order number:** `orderCount = await prisma.order.count()` then `orderNumber = ORD-${orderCount + 1}` is not atomic. Two concurrent POSTs can get the same count; the second insert will fail on `orderNumber @unique`. User sees 500; data is consistent but UX is poor. Fix: use a transaction with `SELECT ... FOR UPDATE`, a sequence, or a dedicated “order number generator” that reserves the next number atomically.
- **Concurrent scrapes:** Two jobs scraping the same source can both pass `loadExistingPhones` at start and then import overlapping leads; dedup is per-run, so duplicates can appear (TOCTOU).

**Async operations:** WhatsApp welcome is fire-and-forget (no await); no queue or retry. Scraper jobs run asynchronously after creation; status is polled. No distributed lock or idempotency keys for critical operations.

---

## 6. Security & Vulnerability

**OWASP-relevant:**

- **Broken access control:** No authentication or authorization. All API routes and pages are open. Middleware explicitly does not protect routes. **High risk** for any deployment beyond a trusted network.
- **Injection:** Prisma uses parameterized queries; no raw SQL or string concatenation in the audited code. **Low risk** for SQL injection.
- **Sensitive data exposure:** Secrets in env; no secrets in repo. Error responses sometimes expose internal details in development (`process.env.NODE_ENV === 'development'` in analytics). Ensure production never returns stack traces or internal messages.
- **Input validation:** Zod used for leads, orders, businesses, templates, suppliers. Scrapers/run and a few other routes validate manually or loosely. Inconsistent validation increases risk of malformed data or abuse (e.g. huge payloads, invalid enums).
- **Least privilege:** N/A for app-level roles; DB user should be restricted to the minimum required permissions in production.

**Cron:** Optional `CRON_SECRET`; when set, cron is protected. When unset, anyone can trigger follow-up processing.

**Recommendation:** Add authentication (e.g. NextAuth or session middleware) and protect all API routes and dashboard pages; validate all inputs with Zod or a single validation layer; avoid returning internal errors to the client in production.

---

## 7. Testability

**Decoupling:** Business rules are not isolated. “Create lead and optionally send welcome” lives in the route; “run scraper, dedup, import, validate” lives in ScraperManager. Testing these flows requires mocking Prisma and possibly Next request/response.

**Pure logic:** `message-generator` (generateFirstMessage, generateFollowUpMessage), `phone-utils` (normalize, validate), `lead-deduplicator` (calculateSimilarity, findDuplicateLead with mocked prisma) are testable in isolation. Most of the app is not.

**Test suite:** No tests; no test script. Critical business rules (order number uniqueness, dedup semantics, message content) are not covered. Refactoring and future changes are high-risk.

**Recommendation:** Add a test runner (Jest or Vitest); start with unit tests for phone-utils, message-generator, and lead-deduplicator. Then add integration tests for one or two API routes (e.g. POST lead, GET leads) with a test DB or Prisma mock. Extract order number generation and scraper orchestration into small, mockable modules.

---

## 8. Technical Debt Assessment

**High-interest debt:**

- **No auth:** Comment in middleware and login stub. Adding auth later will touch almost every route and page. **Cost:** High (pervasive).
- **Order number race:** Small code change (transaction or sequence) but must be done with care and verified. **Cost:** Medium (localized).
- **No tests:** Every change risks regressions. **Cost:** High (ongoing).
- **Duplicate `[id]` route path:** Confusing and fragile; should be a single `[id]` folder. **Cost:** Low (one-time cleanup).
- **ScraperManager god object:** Hard to extend or test. **Cost:** Medium (refactor when adding new scrapers or moving jobs to a worker).
- **Inconsistent validation:** Technical debt in every new or touched route until a single contract is adopted. **Cost:** Medium (incremental).

**Most expensive in six months:** Introducing authentication and tests after the codebase has grown will be the most expensive. Second is changing the persistence or domain model without a repository/service layer (every route and many lib files will need updates).

---

## Prioritized Remediation Roadmap

| Issue | Risk Level | Recommended Refactor | Effort Estimate |
|-------|------------|----------------------|-----------------|
| No authentication on API and pages | **High** | Add auth (e.g. NextAuth or session); protect `/api/*` and dashboard routes; keep cron optional with CRON_SECRET | 3–5 days |
| Order number race (duplicate ORD-*) | **High** | Use transaction + `SELECT FOR UPDATE` on a sequence row, or a dedicated `OrderSequence` table; or generate UUID-based order ref | 0.5–1 day |
| Zero automated tests | **High** | Add Jest/Vitest; unit tests for phone-utils, message-generator, lead-deduplicator; one integration test for POST /api/leads | 2–4 days |
| Observability (no request IDs, structured logs) | **Medium** | Introduce structured logger (pino) with requestId/jobId; log at route entry/exit and key lib calls | 1–2 days |
| Inconsistent validation (scrapers/run, others) | **Medium** | Add Zod schemas for scrapers/run and any remaining routes; use api-errors consistently | 1 day |
| Dedup O(N) DB round-trips | **Medium** | Preload (name, area, city) into a Set or cache for the run; or batch `findFirst`; or accept duplicates and merge later | 1–2 days |
| Leaky abstractions (no service/repository) | **Medium** | Introduce LeadService/OrderService and optional repository layer; move Prisma calls out of routes | 3–5 days |
| ScraperManager god object | **Medium** | Extract interfaces (IScraper, ILeadImporter); move job execution to a dedicated runner; keep ScraperManager as thin orchestrator | 2–3 days |
| Silent background failures (WhatsApp, scraper) | **Medium** | Log with job/lead IDs; optional: dead-letter queue or retry with backoff; alert on repeated failures | 1–2 days |
| Duplicate `[id]` route folder | **Low** | Remove erroneous `[id ]` (with space) folder; keep single `[id]` | 0.5 day |
| Login page no-op | **Low** | Remove /login or replace with real login UI when auth is added | 0.5 day |
| Heavy Leads page component | **Low** | Split into smaller components (LeadsTable, LeadFilters, LeadActions); extract hooks (useLeads, useLeadCounts) | 1–2 days |

---

## Summary Table (Risk vs Effort)

| Priority | Focus | Risk | Effort |
|----------|--------|------|--------|
| P0 | Auth, order number race, first tests | High | ~1–2 weeks |
| P1 | Observability, validation consistency, dedup perf | Medium | ~1 week |
| P2 | Service/repository layer, ScraperManager split, background failure handling | Medium | ~1–2 weeks |
| P3 | Route cleanup, Leads page split | Low | ~2–3 days |

This audit provides a production-readiness snapshot and a prioritized path to harden the system for higher load, multi-user, and safer operations.
