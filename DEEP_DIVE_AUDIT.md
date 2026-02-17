# 360° Deep Dive Audit — Sales Distribution (FMCG CRM)

**Lens:** Lead Systems Architect  
**Scope:** Architectural coherence, operational stability, clean code, security, future-proofing (DX), performance.  
**Deliverable:** Project Health Score (0–100) + Refactoring Roadmap.

---

## 1. Architectural Coherence

**Global pattern:** The project follows a **pragmatic layered** structure: **Presentation (app/)** → **API (app/api/)** → **Shared logic (lib/)** → **Persistence (Prisma)**. There is no formal Clean/Hexagonal architecture: no domain layer, no ports/adapters, no inversion of control.

**Findings:**

| Issue | Evidence | Severity |
|-------|----------|----------|
| **No service layer** | API routes import `prisma` and `lib/*` directly. Business rules (e.g. “create lead then schedule follow-ups”) live partly in route handlers (e.g. `app/api/leads/[id]/message/route.ts` calling `scheduleFollowUpsForLead`) and partly in lib. No `LeadService` or `OrderService` abstraction. | **Leaky:** Route = transport + orchestration + sometimes validation. |
| **Persistence in presentation path** | Route handlers build `where`/`data` from `request.json()` or `searchParams` and pass straight to `prisma.*`. No repository; Prisma is the only data abstraction. | **Leaky:** Changing DB would require touching every API route and many lib files. |
| **ScraperManager as orchestration hub** | `lib/scrapers/scraper-manager.ts` creates jobs, runs scrapers, calls `loadExistingPhones`, `deduplicateLeads`, `batchImportLeads`, `autoValidateScrapedLeads`, and updates job status. All in one class; no interfaces for “lead repository” or “scraper factory.” | **God Object** – orchestration + infra + domain logic in one place. |
| **Inconsistent validation layer** | Leads POST uses Zod (`createLeadSchema`); businesses POST, customers, orders, templates, etc. use ad-hoc `if (!name \|\| !city)` or no validation. Validation is not a dedicated layer. | **Leaky:** Validation bleeds into route handlers with no shared contract. |
| **Predictable boundaries** | `app/` (pages + API), `lib/` (shared), `prisma/` (schema) is clear. Next.js App Router conventions are followed. | **Positive.** |

**Verdict:** **No single global pattern** is consistently applied. Structure is **layered-ish** but with **leaky abstractions**: routes know about Prisma and HTTP together; lib modules know about Prisma; no domain or port layer. Sufficient for a small team/single dev; **not** coherent for strict Clean/Hexagonal.

---

## 2. Operational Stability

**State:** Server state is mostly **database + job records** (ScrapingJob). No global in-memory store. Scraper jobs run **asynchronously** (fire-and-forget after `runScrapingJob` returns job id); status is polled via `/api/scrapers/status/[jobId]` and history.

**Findings:**

| Issue | Evidence | Severity |
|-------|----------|----------|
| **Race conditions** | Multiple concurrent scraping jobs can run; each has its own ScraperManager instance and scraper. Dedup uses `loadExistingPhones` at start of run – so two jobs scraping the same source could both pass dedup and create duplicates (TOCTOU). Import is batched but not transactional across jobs. | **Low–Medium:** Duplicate leads possible under concurrent runs. |
| **Single points of failure** | One Prisma client (singleton in lib/prisma.ts). One DB. If DB is down, all API routes and cron fail. No circuit breaker, no retry policy in route handlers. Cron (`/api/cron/follow-ups`) is single-threaded; one failure logs and continues to next follow-up. | **SPOF:** DB is the main SPOF; acceptable for current scale. |
| **Observability** | **Logging:** Only `console.log` / `console.error` / `console.warn`. No structured logger, no request IDs, no correlation from UI → API → DB. **Tracing:** None. **Metrics:** None. To trace “why did this lead not show up?” you must follow code paths and logs manually. | **Low:** Hard to trace a bug from UI back to DB without request/correlation IDs. |
| **Error propagation** | Most routes catch, log, and return 500 with a generic message. `lib/api-errors.ts` exists and is used in some routes (leads, analytics, imports) but not all (businesses, customers, orders, templates, suppliers). No central error boundary for API. | **Inconsistent:** Partial fail-soft; not full observability. |

**Verdict:** **Moderate stability.** No critical race conditions in core user flows; SPOF is the database (acceptable). **Observability is weak**: no request IDs, no structured logs, no metrics – debugging is code-and-log based.

---

## 3. The “Clean Code” Delta

**Naming:** Generally clear (e.g. `findDuplicateLead`, `batchImportLeads`, `loadExistingPhones`). Some abbreviations (`prisma`, `lead`) are conventional.

**Findings:**

| Issue | Evidence | Severity |
|-------|----------|----------|
| **DRY violations** | **normalizePhone** / **validatePhone** / **validateEmail** duplicated in: `lib/scrapers/base-scraper.ts` (normalizePhone), `app/api/leads/extract-contacts/route.ts` (normalizePhone), `app/api/leads/axiom/route.ts` (normalizePhone, validatePhone, validateEmail), `app/api/axiom/webhook/route.ts` (same three). **categoryNames** duplicated in `lib/message-generator.ts` (top-level and inside `replaceVariables`). | **WET:** Same logic in 4+ places; change Nigerian phone rules requires edits in multiple files. |
| **Cyclomatic complexity** | **Leads page** (`app/leads/page.tsx`): many `useState` (15+), multiple `useEffect`, several handlers (fetchLeads, fetchLeadCounts, handleExportCsv, handleViewScrapedLeads, handleAutoValidate, handleDeleteLead, handleBulkDelete, handleSelectLead, handleSelectAll). Single component ~600+ lines. **Axiom webhook** (`app/api/axiom/webhook/route.ts`): long POST handler with switch on webhook type, multiple handlers in same file (~480 lines). | **High:** One file does too much; branching and state make reasoning harder. |
| **Magic numbers / strings** | Scraper `maxResults: 50`, `BATCH_SIZE = 200` in lead-import-pipeline, `EXPORT_LIMIT = 5000`, `HISTORY_TIMEOUT_MS = 18_000`, `take: 100` in orders. Some centralized, some inline. Status/category strings sometimes cast (`status as LeadStatus`) without central enum reference. | **Low–Medium:** Mostly acceptable; a few shared constants could be in one config. |
| **Type safety** | Occasional `any` (e.g. `updateData: any` in leads [id] PATCH, `data: any` in webhook handlers). Prisma and Zod used well in places. | **Moderate:** Not fully strict. |

**Verdict:** **Code is readable but not DRY** in several areas (phone/email validation, category names). **Complexity is high** in a few large files (Leads page, Axiom webhook). Refactoring to shared utilities and smaller components would reduce cognitive load.

---

## 4. Security & Data Privacy

**Auth:** Middleware allows all requests. Login page redirects to home. No session, no JWT. Cron protected by `CRON_SECRET` when set. Axiom webhook has **no authentication** (comment: “no API key needed”); any client can POST leads/orders/payment updates.

**Findings (OWASP-oriented):**

| Risk | Evidence | OWASP / Note |
|------|----------|---------------|
| **A01:2021 Broken Access Control** | No auth on API or pages. Any user with network access can read/update/delete leads, customers, orders, businesses. | **Critical** for multi-user or exposed deployment. |
| **A02:2021 Cryptographic Failures** | User model has `password` (schema); no sign of hashing in codebase (login is redirect-only). If auth is added later, plaintext passwords would be a failure. | **High** if auth is implemented without hashing. |
| **A03:2021 Injection** | Prisma used for all DB access (parameterized). Raw SQL only in `prisma.$queryRaw` with **literal** templates (analytics, db-connection). No user input concatenated into SQL. | **Low:** SQL injection risk is low. |
| **A05:2021 Security Misconfiguration** | `.env` in `.gitignore`; `.env.example` has placeholders. No security headers visible in middleware. | **Medium:** No HSTS, CSP, etc. |
| **A07:2021 Identification and Authentication Failures** | No authentication. Webhook unauthenticated. | **Critical** if webhook is internet-facing. |
| **A08:2021 Software and Data Integrity** | Dependencies from package.json: Next 14, Prisma 5.7, React 18, Zod 3.22, Playwright 1.40. No automated dependency audit in audit; lockfile present. | **Medium:** Rely on `pnpm audit` / Dependabot. |
| **Least privilege** | App assumes single-tenant / personal use. No RBAC, no per-resource ownership. All-or-nothing access. | **Acceptable** for current design; not for multi-tenant. |

**Verdict:** **Security is “by design” minimal**: no auth, webhook open. **OWASP-wise**: Broken Access Control and Auth Failures are critical if the app is ever exposed or multi-user. Injection and crypto (for DB and current code) are in better shape. **Dependencies:** Not audited here; recommend regular `pnpm audit` and updates.

---

## 5. Future-Proofing (DX)

**Cognitive load:** To understand “what happens when I create a lead?” you must open: API route → possibly message route (schedule follow-ups) → follow-up-scheduler → prisma. No single place that describes the flow. **ARCHITECTURE.md** exists and helps (data flow, modules, how to add a scraper). Single-file understanding is moderate for small files; **high** for leads page, scraper-manager, axiom webhook.

**Swappability:**

| Change | What must change | Effort |
|-------|-------------------|--------|
| **Replace database (e.g. Prisma → Drizzle or raw SQL)** | All `prisma.*` call sites in `app/api` and `lib` (40+ files), plus types. No repository layer. | **Very high:** Prisma is coupled throughout. |
| **Replace UI framework (e.g. Next → Remix)** | All `app/` pages and routing; API could stay if exposed as HTTP. Layout and data-fetching patterns would change. | **High:** App Router and client hooks are tied to Next. |
| **Add a new scraper** | One new class in lib/scrapers, enum in Prisma, two places in ScraperManager (getScraper, getSourceName). Documented in ARCHITECTURE.md. | **Low:** Extension point is clear. |
| **Change validation rules** | Scattered: lead-validator, Zod schemas in leads route, axiom/webhook validateLead, message-generator. | **Medium:** No single validation module. |

**Verdict:** **DX is adequate for a small team** with the existing docs. **Future-proofing is weak** for DB or framework swap: **high coupling** to Prisma and Next.js. Reducing coupling (e.g. repository layer, shared validation) would improve swap cost.

---

## 6. Performance & Resource Management

**Findings:**

| Issue | Evidence | Severity |
|-------|----------|----------|
| **Unbounded list APIs** | **businesses** GET and **customers** GET have **no `take`/`limit`**. Large tables will return full result sets. | **Medium:** Risk of large payloads and memory. |
| **Batching already introduced** | Lead import uses `batchImportLeads` / `batchImportLeadRecords` with chunks (200). Dedup uses `loadExistingPhones` to reduce round-trips. Analytics revenue-by-city uses aggregated SQL. | **Positive.** |
| **Scraper resource cleanup** | Scrapers (e.g. Finelib, Google Maps) close browser in `try`/`catch`/`finally` or on error. ScraperManager calls `scraper.close()` after run. Risk of not closing on early return (e.g. cancel) – code paths checked; close is invoked. | **Low:** Generally cleaned up. |
| **Memory leaks (client)** | React: useEffect with intervals (scrapers history) cleared in cleanup. No obvious global leak. Large lists (e.g. 500 leads) held in state on leads page – acceptable. | **Low.** |
| **Unnecessary network calls** | Leads page: `fetchLeadCounts()` fetches up to 500 leads again; separate from `fetchLeads()`. Two requests for overlapping data when filters match. | **Medium:** Could be one request with counts or include counts in list response. |
| **N+1 / loops** | Dedup still does per-lead DB for name/area similarity (after phone Set check). Validation batch runs per lead (validateLead in loop). Acceptable for moderate volume; documented in ARCHITECTURAL_AUDIT. | **Known;** improvements in progress or documented. |

**Verdict:** **Performance is acceptable** for current scale. Main gaps: **unbounded businesses/customers** lists and **redundant fetch** for lead counts. No major memory leaks identified.

---

# Project Health Score: **58 / 100**

| Dimension | Score (0–20) | Rationale |
|-----------|--------------|-----------|
| Architectural Coherence | 8 | Layered-ish but leaky; no service/repository; God Object in ScraperManager. |
| Operational Stability | 10 | State and SPOFs acceptable; observability weak (no request IDs, tracing, metrics). |
| Clean Code Delta | 9 | Readable but WET (phone/email/category); high complexity in a few large files. |
| Security & Data Privacy | 6 | No auth; webhook open; injection low; least privilege not applicable. |
| Future-Proofing (DX) | 10 | Docs help; high coupling to Prisma and Next; validation scattered. |
| Performance & Resource Management | 15 | Batching and aggregation in place; unbounded lists and redundant calls. |

**Summary:** The project is **functional and maintainable for a small team** but has **no clear architecture**, **weak observability**, **duplicated logic**, **minimal security**, and **tight coupling** to DB and framework. The refactoring roadmap below targets the highest-impact improvements.

---

# Refactoring Roadmap

| Component | Current Issue | Suggested Fix | Priority (1–5) |
|-----------|----------------|---------------|-----------------|
| **Middleware / Auth** | No authentication; all routes open. | Add auth (e.g. NextAuth or session); protect `/api/*` (except cron/public) and dashboard routes; optionally protect Axiom webhook with API key or signature. | 1 |
| **API routes (businesses, customers, orders, templates, suppliers)** | No input validation (Zod); unbounded list (businesses, customers); inconsistent error responses. | Add Zod schemas for POST/PATCH; add `limit`/`take` (e.g. default 100, max 500) to GET list routes; use `lib/api-errors` for all error responses. | 1 |
| **normalizePhone / validatePhone / validateEmail** | Duplicated in base-scraper, extract-contacts, axiom route, axiom webhook, lead-validator. | Create `lib/phone-utils.ts` (and optionally `lib/email-utils.ts`) with single implementation; use in all call sites. | 2 |
| **message-generator categoryNames** | Duplicated at top level and inside `replaceVariables`. | Single `categoryNames` (and cityNames) constant; reuse in replaceVariables. | 3 |
| **ScraperManager** | God Object: orchestration + scraper factory + dedup + import + validation. | Extract: (1) `LeadImportService` (or use case) that takes unique leads and source, calls batchImport + optional validate; (2) keep ScraperManager as orchestrator only (run scraper → dedup → call import service). Optional: scraper factory interface. | 2 |
| **Leads page (app/leads/page.tsx)** | Very large component; 15+ state values; high cyclomatic complexity. | Split: e.g. `useLeadsList`, `useLeadCounts`, `LeadsToolbar`, `LeadsTable`, `LeadFilters`; reduce state and effects into custom hooks and subcomponents. | 2 |
| **Axiom webhook route** | Long file; multiple handlers; `data: any`; no auth. | Split handlers into `lib/webhooks/axiom-handlers.ts` (or similar); add webhook auth (API key or HMAC); type payload with Zod or interfaces. | 2 |
| **Observability** | Only console.log/error; no request IDs or tracing. | Add middleware or route wrapper that sets/generates request ID (e.g. header or async context); use structured logger (e.g. pino) with requestId; optionally add OpenTelemetry or similar for traces. | 3 |
| **Businesses & customers GET** | Unbounded `findMany`. | Add `limit` (and optionally `cursor`) to both; default e.g. 100, max 500. | 2 |
| **Lead count fetch** | fetchLeadCounts() and fetchLeads() both fetch leads (overlap). | Option A: GET /api/leads returns `{ data, nextCursor, limit, counts: { byStatus } }` when requested (e.g. `?includeCounts=true`). Option B: GET /api/leads/counts or aggregate in one call. | 3 |
| **Repository / persistence abstraction** | Prisma used directly everywhere; swapping DB is very costly. | Introduce a thin repository layer (e.g. LeadRepository, OrderRepository) that wraps Prisma calls; routes and lib call repositories. Enables testing and future DB swap. | 4 |
| **User model & password** | Schema has password field; no hashing or auth flow. | When adding auth: never store plaintext passwords; use bcrypt/argon2 and secure session storage. | 1 (when implementing auth) |
| **Dependencies** | Not audited. | Run `pnpm audit` regularly; fix high/critical; plan upgrades for Next 14 → 15, React 18, etc. | 3 |
| **Error boundary (API)** | No central handler; each route catches and returns 500. | Optional: Next.js route segment error.ts or wrapper that logs, maps known errors to status codes, and returns consistent JSON shape. | 4 |
| **Validation layer** | Validation scattered (Zod in leads, ad-hoc elsewhere; lead-validator in lib; webhook validators). | Introduce shared validation schemas (Zod) per domain (lead, business, order, etc.) and reuse in API and lib where applicable. | 3 |

---

*End of Deep Dive Audit. Priorities: 1 = Critical, 2 = High, 3 = Medium, 4 = Lower, 5 = Nice-to-have.*
