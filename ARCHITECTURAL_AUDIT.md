# Deep-Tier Architectural Audit — Sales Distribution (FMCG CRM)

**Auditor lens:** Principal Software Engineer (FAANG-level).  
**Scope:** Structural integrity, scalability, maintainability, edge-case resilience, security.  
**Output:** Senior verdict per section + prioritized action plan.

---

## 1. Structural Integrity

### 1.1 Folder Structure & Module Boundaries

**Current layout:**
- `app/` — Next.js App Router: `api/`, page routes (`leads/`, `customers/`, `orders/`, `scrapers/`, etc.), `components/`
- `lib/` — Shared logic: `prisma.ts`, `message-generator.ts`, `lead-deduplicator.ts`, `lead-validator.ts`, `lead-priority.ts`, `cron/`, `scrapers/`, `csv-parser.ts`
- `prisma/` — Schema only

**Findings:**

| Issue | Location | Severity |
|-------|----------|----------|
| **No service layer** | API routes call `prisma` and `lib/*` directly. Business rules (e.g. “create lead + schedule follow-ups”) are split between route handlers and lib. | Medium |
| **ScraperManager as hub** | `lib/scrapers/scraper-manager.ts` orchestrates scraping, dedup, import, and auto-validation. It directly instantiates all scraper classes, imports `prisma`, `deduplicateLeads`, `autoValidateScrapedLeads`. Single class owns job lifecycle, DB writes, and external I/O. | High (God Object risk) |
| **ScraperManager instantiated everywhere** | `new ScraperManager()` in run, history, cancel, status routes and in `lib/scrapers/scheduler.ts`. No shared instance, no DI — acceptable for stateless use but reinforces “manager does everything.” | Low |
| **Boundary blur** | `lead-deduplicator` and `lead-validator` both use `prisma` and Prisma types. No repository or port; persistence is not abstracted. | Medium |
| **App Router consistency** | Routes follow `app/[domain]/[id]/page.tsx` and `app/api/[domain]/route.ts`. Structure is predictable. | Good |

**Spaghetti / tight coupling:**  
Logic is not truly “spaghetti” (flow is readable), but **ScraperManager** is a **God Object**: it knows how to create jobs, pick scrapers, run them, deduplicate, import one-by-one, and trigger validation. If you need to swap dedup strategy or add a queue, you touch this single file. **Tight coupling**: scrapers are hardcoded in a `switch`; Prisma and lib functions are not behind interfaces, so testing or swapping implementations requires mocking at the module level.

---

### 1.2 Senior Verdict — Structural Integrity

**Verdict:** **Conditional pass.** Structure is understandable and consistent, but **ScraperManager is a God Object** and there is **no clear service/repository boundary**. For current team size and traffic this is workable; for 100x scale or multiple developers, the lack of boundaries will cause merge conflicts, hard-to-test code, and risky changes.

**Donkey analogy:** The cart (ScraperManager) is glued to scraping, dedup, DB, and validation. You can’t change the wheels (dedup) without touching the whole cart. You need a **hitch** (interfaces / services) so scraping, dedup, and persistence can be swapped or tested in isolation.

---

## 2. Scalability Bottlenecks

### 2.1 Complexity Analysis (O Notation)

| Code path | Current behavior | Complexity | At 100x load |
|-----------|------------------|-------------|--------------|
| **Lead deduplication** | For each of N scraped leads, `findDuplicateLead` does up to **3 sequential DB calls** (by phone, by name+area, by name). Each `findFirst` with `contains`/`mode: 'insensitive'` may **not use indexes** (e.g. on `Lead.name`, `Lead.area`) → full table scan. | **Time:** O(N × L) where L = lead table size. **Round-trips:** 3N. | 10k leads × 100k existing leads → millions of row scans and 30k round-trips. **Critical.** |
| **ScraperManager import loop** | For each unique lead after dedup, **one `prisma.lead.create`**. No batching. | **Round-trips:** O(N). | 10k unique leads → 10k sequential creates. **Critical.** |
| **CSV import** | Per row: `findFirst` (duplicate check) + `create`. | **Round-trips:** 2 × rows. | 5k rows → 10k round-trips. **High.** |
| **from-contacts** | Per contact: `findFirst` + `create`. | Same as CSV. | **High.** |
| **autoValidateScrapedLeads** | Fetches all SCRAPED leads; then `validateLeadsBatch` runs **for each lead**: `validateLead` (1 findUnique + 1 findFirst + 1 update) = 3 DB calls per lead. All sequential. | **Time:** O(N). **Round-trips:** 3N. | **High.** |
| **Analytics overview** | `revenueByCity` uses `prisma.order.findMany({ include: { customer, payments } })` with **no limit**. Loads all orders into memory, then reduces in JS. | **Memory & CPU:** O(orders). | 100k orders → large payload and heap. **High.** |
| **Leads GET** | `take: 1000` hardcoded. No cursor/offset pagination. | O(1000) per request. | Users cannot page beyond 1k; list API will need pagination. **Medium.** |
| **Follow-up processor** | For each follow-up: `generateMessage` (1 DB for template) + `getWhatsAppLink` + 1 update. Sequential over follow-ups. | O(F) round-trips, F = follow-ups. | Hundreds of follow-ups → hundreds of round-trips. **Medium.** |

**Index usage:**  
Schema has `@@index([phone])`, `@@index([status])`, etc. on `Lead`. **But** `contains` + `mode: 'insensitive'` (e.g. in dedup and lead-validator) typically prevents use of a plain B-tree index; PostgreSQL may do full table scans or use a separate trigram/GIN index if you add one.

---

### 2.2 Donkey Analogy — Complexity

**Technical:** Nested or repeated work (loop over N, each step does work proportional to L) gives O(N × L). With 10 users that’s fine; with 10,000 users it explodes.

**Donkey:** If you have one carrot in a small bucket, dumping the bucket is fine. If you have one carrot in a giant field, you can’t sniff every blade of grass — you need a **map (index)**. Here, the code “sniffs” the whole lead table for every new lead (dedup) and does one DB round-trip per lead (import). At scale the donkey gets tired and the app falls over.

---

### 2.3 Caching & Database Patterns

- **No application-level cache** (e.g. Redis) for hot reads (e.g. lead counts, job status).
- **No connection pooling** beyond Prisma’s default (Prisma uses pooling when `DATABASE_URL` points to a pooler).
- **No read replicas** or query splitting; all reads/writes go to one DB.
- **createMany** is used in follow-up-scheduler (good); **not** used in ScraperManager or CSV/from-contacts import.

---

### 2.4 Senior Verdict — Scalability

**Verdict:** **Fail for 100x load.** Main bottlenecks:

1. **Deduplication:** O(N) DB round-trips and O(N × L) row scans (with non-index-friendly predicates). Needs batched lookup and/or indexed uniqueness (e.g. unique on normalized phone + city).
2. **Import:** N sequential `create` calls. Needs batched `createMany` or chunked transactions.
3. **Analytics:** Unbounded `findMany` for revenue-by-city. Needs aggregation in DB (e.g. `groupBy`) and/or pagination/limits.
4. **No caching** for frequently read data.

**Action:** Introduce batching, DB-side aggregation, and indexes (or stricter uniqueness) before scaling traffic or data volume.

---

## 3. Bus Factor & Maintainability

### 3.1 Self-Documenting Quality

| Aspect | Assessment |
|--------|------------|
| **Naming** | Generally clear: `findDuplicateLead`, `deduplicateLeads`, `validateLead`, `ScraperManager.runScrapingJob`. Some abbreviations (`prisma`, `lead`) are standard. |
| **Abstractions** | `BaseScraper` + concrete scrapers are a clear extension point. `ScrapedLead` and `MessageContext` are well-defined. **But**: no interface for “lead repository” or “scraper factory”; a new dev must trace from API → ScraperManager → prisma/deduplicator/validator. |
| **Documentation** | Inline comments exist in key places (e.g. lead-deduplicator, message-generator, cron). **No** architecture doc, no ADRs, no API contract docs. AUDIT_AND_STRATEGY.md and INTERNAL_SCRAPERS.md help but don’t describe module boundaries or data flow. |
| **Consistency** | API routes mix “return 500 + generic message” with occasional richer handling (e.g. analytics DB error, scrapers history timeout). No shared error type or middleware. |
| **Types** | TypeScript and Prisma enums are used; some `any` (e.g. analytics `ordersByMonth as any[]`, `error: any` in catch). |

**Will a new dev be lost?**  
They can follow “run a job → ScraperManager → scrapers + dedup + import” from the code. They will **not** quickly see where to add a new scraper type, how to change dedup without touching import, or which APIs are safe to call at scale. **Medium risk:** abstractions are intuitive locally but system-wide boundaries are undocumented and coupled.

---

### 3.2 Senior Verdict — Bus Factor & Maintainability

**Verdict:** **Conditional pass.** Code is readable and naming is decent, but **documentation and boundaries are weak**. Single point of failure is the person who knows “how ScraperManager and dedup interact with the DB.” To improve bus factor: add a one-page architecture diagram (data flow, main modules), document “how to add a scraper” and “how lead creation works,” and introduce a thin service layer so business rules live in one place.

---

## 4. Edge-Case Resilience

### 4.1 Error-Handling Strategy

| Pattern | Where | Assessment |
|---------|--------|------------|
| **Try/catch with response** | Most API routes: `catch (error) { console.error(...); return NextResponse.json({ error: '...' }, { status: 500 }) }`. Caller gets a 500 and a message; error is logged. | **Good:** no truly empty catch. **Gap:** no error code or retry hint; no distinction between “client error” vs “DB down.” |
| **Silent-ish failure** | `lib/message-generator.ts` `getTemplate`: on error returns `null`; caller gets fallback message. Caller may not know template fetch failed. | **Soft fail:** user still gets a message. **Risk:** no metric or log that template DB is failing. |
| **ScraperManager validation** | After import, `autoValidateScrapedLeads()` is called; on exception it’s caught, logged, and job still marked COMPLETED. | **Fail-soft:** job doesn’t fail if validation fails. **Risk:** job shows “imported N” but “0 validated” with no clear reason in UI. |
| **Prisma connection** | `lib/prisma.ts`: `prisma.$connect().catch((error) => { console.error(...); // Don't throw - let it retry on first query })`. | **Fail-soft:** first query may fail with connection error. Acceptable if first query is retried by caller; otherwise user sees generic 500. |
| **Scraper per-query** | If one query in a multi-query job fails, ScraperManager catches, logs, and continues with next query. | **Good:** one bad query doesn’t kill the whole job. |
| **Follow-up processor** | Per follow-up try/catch; failed item gets `results.push({ followUpId, error })`; loop continues. | **Good:** one bad follow-up doesn’t stop the rest. |
| **Analytics** | Catches and distinguishes PrismaClientInitializationError / “Can’t reach database server” → 503 with message. | **Good:** DB down is communicated. |
| **Scrapers history** | Promise.race with timeout → 503 + TIMEOUT code. | **Good:** slow DB doesn’t hang forever. |

**No global error boundary** for API (e.g. Next.js error.ts or middleware that maps known errors to status codes). No structured error type (e.g. `{ code: 'DB_UNAVAILABLE', message: string }`).

---

### 4.2 Donkey Analogy — Silent Failure

**Technical:** A catch that only logs and returns a generic value can hide the real cause. The system “lies” to the user (e.g. “Failed to fetch”) while the backend might be hitting DB timeouts or validation bugs.

**Donkey:** If a rock gets stuck in your hoof, you should limp or bray so the farmer knows. If you keep walking as if nothing happened, your leg may get worse. Here, most catches **do** log and return a response, so the system isn’t fully “silent” — but the **reason** (e.g. template fetch failed, validation failed) is not always surfaced to the client or to monitoring.

---

### 4.3 Senior Verdict — Edge-Case Resilience

**Verdict:** **Conditional pass.** There are **no empty catch blocks**; failures are logged and most APIs return 500/503 with a message. **Gaps:** (1) Template fetch failure is only visible in logs, not to client or metrics. (2) Validation failure in ScraperManager doesn’t surface a clear “partial success” to the UI. (3) No unified fail-soft contract (e.g. standard error shape + codes). For production, add a small set of error codes and ensure critical paths (import, cron) expose “partial success” and reasons where relevant.

---

## 5. Security & Best Practices

### 5.1 Hardcoded Secrets

- **Finding:** No hardcoded secrets in repo. `process.env` used for `DATABASE_URL`, `CRON_SECRET`, `AXIOM_API_KEY`, `NODE_ENV`. `.env` is in `.gitignore`; `.env.example` has placeholders only.
- **Verdict:** **Good.**

### 5.2 Injection

- **SQL:** Prisma is used for almost all DB access; Prisma parameterizes queries. `prisma.$queryRaw` in analytics uses a **literal template** (no user input). **No SQL injection risk** from current code.
- **NoSQL / Command:** N/A (no NoSQL or shell commands built from user input).
- **Input validation:** Request bodies are read as JSON and fields used directly (e.g. `body.name`, `body.phone`). Enums are cast (`city as City`) without runtime validation in several routes. **Risk:** Malformed or unexpected enum values could cause Prisma errors or inconsistent state. **Recommendation:** Validate enums (e.g. `Object.values(City).includes(city)`) or use Zod/Joi for API input.

### 5.3 Auth & Authorization

- **Middleware:** No auth; all routes are open. Cron route checks `CRON_SECRET` when set (Bearer). Axiom route checks `AXIOM_API_KEY` when set.
- **Verdict:** By design for “personal CRM”; for production, auth and route protection are required (as noted in AUDIT_AND_STRATEGY.md).

### 5.4 Modern Language / Practices

- **Async/await:** Used consistently; no callback hell.
- **Promises:** Used appropriately (e.g. `Promise.all` in analytics, `Promise.race` for timeout in scrapers history).
- **TypeScript:** Used throughout; some `any` in catch and in analytics mapping. Stricter typing (e.g. `unknown` in catch, typed error shape) would improve safety.
- **Verdict:** **Adequate;** small improvements possible (reduce `any`, validate API input).

---

### 5.5 Senior Verdict — Security & Best Practices

**Verdict:** **Pass with caveats.** No secrets in code; Prisma avoids SQL injection; cron and Axiom use env-based secrets. **Gaps:** (1) No auth (documented as intentional). (2) API input validation is ad hoc (enum casting, no schema validation). (3) Minor: reduce `any`, add input validation (e.g. Zod) for public or webhook endpoints.

---

## 6. Prioritized Action Plan

### High impact (do first for production-grade quality)

| # | Action | Section | Rationale |
|---|--------|---------|-----------|
| 1 | **Batch lead import** | Scalability | Replace per-lead `prisma.lead.create` in ScraperManager (and CSV/from-contacts) with `createMany` in chunks (e.g. 100–500 per batch) or a single transaction with multiple inserts. Cuts round-trips from O(N) to O(N/batch size). |
| 2 | **Deduplication at scale** | Scalability | (a) Pre-load existing phones (and optionally name+city) for the current job into a Set or map; do in-memory dedup first. (b) For DB dedup, use indexed lookups only (e.g. exact phone match); consider unique constraint on normalized phone + city. (c) Avoid “contains” + insensitive on large tables without trigram/GIN index. |
| 3 | **Analytics: no unbounded load** | Scalability | Replace `findMany` for revenue-by-city with a single aggregated query (e.g. `groupBy` customer.city with sum of payments, or raw SQL aggregation). Add a reasonable limit or time range for “orders by month” if not already bounded. |
| 4 | **ScraperManager split** | Structural | Extract “import pipeline” (dedup → batch create) and “validation pipeline” into separate functions or a small service; inject or call them from ScraperManager so job orchestration doesn’t own every detail. Reduces God Object and makes testing and future queue-based import easier. |
| 5 | **API input validation** | Security | Validate enums and required fields for POST/PUT (e.g. Zod). Prevents invalid enum values and clarifies 400 vs 500. |

### Medium impact (next)

| # | Action | Section | Rationale |
|---|--------|---------|------------|
| 6 | **Pagination for list APIs** | Scalability | Leads (and similar lists) should support cursor or offset + limit; remove or raise hard 1000 cap and document limits. |
| 7 | **Structured errors** | Resilience | Define a small set of error codes (e.g. `DB_UNAVAILABLE`, `VALIDATION_FAILED`, `NOT_FOUND`) and return them in JSON; use in catch blocks and optionally in a central API error handler. |
| 8 | **Template fetch failure visibility** | Resilience | When `getTemplate` fails, log with context and consider returning a flag or message in the response so the client or cron can report “template load failed, used fallback.” |
| 9 | **One-page architecture doc** | Maintainability | Document: data flow (scraper → lead → customer → order), main modules (ScraperManager, dedup, validator, cron), and “how to add a scraper.” Reduces bus factor. |
| 10 | **Index / uniqueness for dedup** | Scalability | Add DB index or unique constraint that matches how you deduplicate (e.g. normalized phone + city) so duplicate checks are O(1) or O(log L) instead of full scan. |

### Low impact (nice to have)

| # | Action | Section | Rationale |
|---|--------|---------|------------|
| 11 | **Reduce `any`** | Best practices | Use `unknown` in catch; type analytics raw query result; avoid `as any` where possible. |
| 12 | **Repository or service layer** | Structural | Introduce a thin LeadService (or repository) that encapsulates create/dedup/validation so API routes and ScraperManager call one place. Enables testing and future swap of storage. |
| 13 | **Caching** | Scalability | Add caching (e.g. Redis or in-memory with TTL) for job history or lead counts if those endpoints become hot. |
| 14 | **Auth** | Security | When moving to multi-user or public deployment, add auth and protect API and dashboard routes as described in AUDIT_AND_STRATEGY.md. |

---

## 7. Summary Table

| Section | Senior Verdict | One-line summary |
|---------|----------------|------------------|
| **Structural integrity** | Conditional pass | Clear folders but ScraperManager is a God Object; no service/repository boundary. |
| **Scalability** | Fail at 100x | O(N) round-trips and O(N×L) dedup; unbounded analytics; no batching or caching. |
| **Bus factor & maintainability** | Conditional pass | Readable code, weak boundaries and docs; new dev can follow flow but not system design. |
| **Edge-case resilience** | Conditional pass | No silent catches; logging and 500/503 present. Gaps: template/validation failure visibility, no structured errors. |
| **Security & best practices** | Pass with caveats | No secrets in code; Prisma avoids injection; auth is intentionally absent; input validation is ad hoc. |

---

*End of audit. Use the action plan in order of priority (High → Medium → Low) to move the project toward production-grade quality.*
