# 360° Business & Technical Audit: Nigerian Drinks Supply (Energy + Cognac)

**Role:** CTO & Business Strategist  
**Business goal:** High-reliability supply for Nightclubs, Event Planners, Gyms, Retailers — Energy Drinks + Cognac.  
**Scope:** Codebase audit vs. stated business needs + Technical Debt vs. Business Value matrix.

---

**Note (personal project):** This app is focused on **Leads → Scrapers → Send message (WhatsApp) → Mark as messaged**. Inventory, tiered pricing, bulk cart, and logistics tracking are **out of scope** for this build. Dashboard access is protected by an optional **PIN** (set `DASHBOARD_PIN` in `.env`). The audit below documents gaps if you later want to add B2B/volume features.

---

## Part 1: Business Goals vs. Codebase Reality

### 1. High-Volume Logic (Nightclubs / Events)

**Business need:** Bulk ordering, predictable pricing, checkout/cart optimized for large-scale orders.

| What we need | What the code does | Gap |
|--------------|--------------------|-----|
| Bulk ordering | Orders are created with an array of `items` (productId, quantity, unitPrice). No cart; order is created in one POST. | **No cart** — user must know quantities and prices at create time. No "add to cart" or "bulk add 10 cases" flow. |
| Predictable pricing | `Product.unitPrice` is **single global price**. Order items store `unitPrice` per line (can override at order time). | **No tiered or segment pricing.** Nightclub and mini-mart see the same price. No "carrot price" rule. |
| High-volume UX | Order create is a single form; no quantity breaks (e.g. "24 cans = 1 case"), no bulk templates. | **Not optimized for large-scale.** No case/crate logic, no "repeat last order" or templates. |

**Verdict:** **Fails** high-volume and predictable-pricing needs. Logic is single-order, single-price; no B2B bulk or segment-specific pricing.

---

### 2. Reliability & Stock-Out Prevention

**Business need:** Gyms/retailers hate stock-outs. Low-stock alerting, safety stock, inventory integrity.

| What we need | What the code does | Gap |
|--------------|--------------------|-----|
| Inventory model | **No inventory table.** Products have name, category, unitPrice, unit — no `quantityOnHand`, `reserved`, or `safetyStock`. | **No stock concept.** System cannot know "10 cases left" or "empty bucket." |
| Low-stock alerting | No stock → no alerts. No cron or UI for "below safety stock." | **Missing.** |
| Safety stock math | No fields, no reorder-point logic. | **Missing.** |
| Oversell prevention | Order create does **not** check or decrement any stock. Two gyms can each order 6 cases when only 10 exist. | **Empty bucket rule violated.** No reservation or atomic decrement. |

**Verdict:** **Fails** reliability and stock-out prevention. No inventory, no alerts, no protection against oversell.

---

### 3. The Nightlife / Weekend Surge (Performance)

**Business need:** Friday evening burst — 50 nightclubs ordering at once without crashes.

| What we need | What the code does | Gap |
|--------------|--------------------|-----|
| DB connection pooling | Prisma default; connection string can use pooler (e.g. Neon `-pooler`). No explicit pool size in code. | **Depends on host.** If DATABASE_URL uses a pooler, pooling exists; otherwise single-connection risk. |
| Concurrent order handling | Order create is one `prisma.order.create` with nested `items.create`. No `$transaction` for order+inventory (no inventory anyway). No locking. | **No application-level locking.** Many concurrent creates can hit DB at once — DB handles it, but no rate limiting or queue. |
| Scraper vs. API | Scrapers run in same Node process; long Playwright runs can tie up CPU/memory. | **Friday gate risk:** Heavy scrape + many orders = same process competing. |
| Caching / read replicas | No Redis, no read replicas, no response caching for product list or pricing. | **Single DB, no cache.** Under burst, every request hits DB. |

**Verdict:** **Partial fail.** App can handle moderate concurrency (stateless API, Prisma), but no burst-specific design (no queue, no rate limit, no horizontal scaling or caching). "50 donkeys through one gate" — gate is DB + one Node process.

---

### 4. B2B User Experience (Business Profiles & Segment Pricing)

**Business need:** Business profiles (e.g. Hotel vs. Gym) and segment-specific pricing.

| What we need | What the code does | Gap |
|--------------|--------------------|-----|
| Customer segment | `Customer` has `category` (GYM, EVENT_CENTER, CLUB, LOUNGE, etc.) and optional `businessId`. **No** `priceTier`, `customerSegment`, or `pricingRuleId`. | **Segment exists for classification only.** Not used for pricing. |
| Product pricing by segment | `Product` has one `unitPrice`. No `CustomerProductPrice`, `PriceTier`, or rule engine. | **Single price for everyone.** "Carrot price" rule not implemented. |
| Business profile | `Business` exists (name, category, city, etc.) and can link to customers. No pricing or terms attached to Business. | **Profile is descriptive only.** No B2B-specific pricing or terms. |

**Verdict:** **Fails** B2B pricing and "business profile" pricing. Data structure is B2B-friendly for *classification* (category, business) but not for *conditional pricing*.

---

### 5. Logistics & Delivery Tracking

**Business need:** Order status robust enough for event planners to have real-time confidence in delivery.

| What we need | What the code does | Gap |
|--------------|--------------------|-----|
| Order status | `OrderStatus`: PENDING, CONFIRMED, DELIVERED, CANCELLED. Stored on `Order.status`; editable via PATCH. | **Simple and manual.** No "DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY". |
| Delivery date | `Order.deliveryDate` (DateTime?). Can set/update via PATCH. | **Single date only.** No time window, no "delivery slot." |
| Real-time updates | No WebSockets, no push, no webhook. Client must refresh or poll. | **No real-time.** Event planner must refresh page. |
| Tracking / proof | No tracking number, no driver assignment, no ETA updates, no proof-of-delivery. | **No logistics trail.** |

**Verdict:** **Partial fail.** Basic status + delivery date exist and are editable, but no granular logistics states, no live updates, no tracking — not "real-time confidence" for event planners.

---

## Part 2: The Sub-Tutorial (Technical & "Donkey" Version)

### 1. Multi-Tenant Pricing — "The Carrot Price Rule"

**Technical:** Conditional pricing: different rates for Nightclub vs. Mini-mart. Need `price_tier` / `customer_segment` or a `CustomerProductPrice` (customerId, productId, price) table.

**Current code:**  
- `Product` has a single `unitPrice`.  
- No `priceTier` or `customerSegment` on Customer.  
- Order items accept any `unitPrice` (could be overridden at order time), but there is no *logic* that says "if customer is CLUB, use this price."

**Donkey version:** You sell one price per carrot to everyone. The big hotel wants 1,000 carrots at half price; the code can’t remember "who is asking." So you either lose the customer or lose margin.

**Gap:** No table or column to store "who gets which price." Need at least one of: Customer.priceTier, CustomerProductPrice, or ProductPricingRule (e.g. by CustomerType/category).

---

### 2. High-Concurrency / Throughput — "The Friday Gate Rule"

**Technical:** When 50 nightclubs click "Order" at 6 PM Friday, we need enough "gates" (connections, capacity) and no single bottleneck (memory, locks).

**Current code:**  
- Prisma client is singleton; connection pooling depends on `DATABASE_URL` (e.g. Neon pooler).  
- No explicit connection_limit or pool size in app code.  
- No rate limiting on POST /api/orders.  
- No queue (e.g. Bull/Redis) for order processing.  
- Scrapers run in-process; under load, API and scrapers share same process.

**Donkey version:** 50 donkeys at one narrow gate at sunset → crashes. We need either a wider gate (more connections/instances) or 50 gates (horizontal scale / queue with workers).

**Gap:** No application-level pooling config, no queue, no rate limit. Burst traffic can exhaust DB connections or CPU if scrapers are also running.

---

### 3. Inventory Integrity — "The Empty Bucket Rule"

**Technical:** Avoid oversell: if 10 cases exist and two customers each order 6, only one should succeed (or both get partial). Need: inventory table, atomic decrement (or reservation) inside a transaction, and optionally row-level locking.

**Current code:**  
- **No inventory table.** No quantity on hand, no reserved, no safety stock.  
- Order create does **not** check or reduce any stock.  
- Two concurrent orders for the same product can both succeed → oversell.

**Donkey version:** One bucket, two thirsty donkeys. You must not promise the full bucket to both. Code must "reserve" or "decrement" atomically so the second request sees "not enough" and is rejected or adjusted.

**Gap:** No inventory, no reservation, no atomic decrement. Full redesign needed: Inventory (productId, quantityOnHand, reserved, safetyStock?), then order flow: transaction that reserves or decrements and creates order.

---

### 4. Categorization — "The Hay vs. Grass Rule"

**Technical:** Product attributes: Energy drinks (expiry, caffeine, format); Cognac (vintage, luxury). The "Product" model should support attributes so premium Cognac isn’t treated like a single can of soda.

**Current code:**  
- `Product`: name, category (string: "ENERGY_DRINK", "COGNAC", "WATER", "SOFT_DRINK"), unitPrice, unit, supplierId, isActive, notes.  
- **No** expiry date, no caffeine, no vintage, no SKU, no barcode, no "attributes" JSON or related table.

**Donkey version:** Hay (stable) vs. grass (perishable). If the system stores both the same way, you can’t apply different rules (e.g. FEFO for energy drinks, vintage display for Cognac). Premium feel and operations (e.g. expiry alerts) need product-specific attributes.

**Gap:** Product is one-size-fits-all. Need either: optional fields (expiryDate, vintage, etc.) or a flexible ProductAttribute / JSON field so Energy vs. Cognac can diverge without new tables per type.

---

## Part 3: Technical Debt vs. Business Value Matrix

Prioritize by **business value** (impact on nightclubs, events, gyms, retailers) and **technical debt** (effort to fix).

| # | Gap | Business value (impact) | Technical debt (effort) | Recommendation |
|---|-----|-------------------------|-------------------------|----------------|
| 1 | **Inventory + oversell prevention** | **Critical** — prevents stock-outs and angry customers (empty bucket). | High — new table(s), order flow in transaction, reserve/decrement logic. | **Do first.** Without inventory, you cannot promise reliability. |
| 2 | **Segment / tiered pricing** | **High** — nightclubs vs. retailers expect different rates; margin and conversion. | Medium — Customer.priceTier or CustomerProductPrice + resolve price in order flow. | **Do early.** Core B2B expectation (carrot price). |
| 3 | **Order status + delivery tracking** | **High** — event planners need confidence (status, date, later: tracking). | Medium — add status enum values, delivery slot, optional tracking number + UI. | **Next.** Improves trust without changing core order model. |
| 4 | **Bulk / cart UX** | **Medium** — large orders (nightclubs, events) easier with cart, cases, templates. | Medium — cart in UI, optional "case" unit, repeat-order or templates. | **After 1–3.** Builds on existing order API. |
| 5 | **Product attributes (Energy vs. Cognac)** | **Medium** — premium feel, expiry, FEFO, vintage. | Low–Medium — schema add optional fields or JSON; UI and reports. | **Parallel or after bulk.** Differentiates categories (hay vs. grass). |
| 6 | **Friday surge (pooling, queue, rate limit)** | **Medium** — avoid crashes under burst. | Medium — connection/pool config, optional queue (e.g. Bull), rate limit on POST /orders. | **As traffic grows.** Baseline is OK for moderate load. |
| 7 | **Real-time delivery updates** | **Nice-to-have** — push/WebSocket for "out for delivery." | High — new infra (WebSocket or push). | **Later.** After status/tracking is solid. |

---

## Part 4: Summary Table (Where the Code Fails)

| Business goal | Meets? | Main gap |
|---------------|--------|----------|
| High-volume / bulk ordering | ❌ | No cart; no bulk templates; single-price. |
| Predictable / tiered pricing | ❌ | One price per product; no segment/tier. |
| Stock-out prevention | ❌ | No inventory, no safety stock, no alerts. |
| Weekend surge resilience | ⚠️ | No queue/rate limit; single process with scrapers. |
| B2B profiles & segment pricing | ❌ | Category exists; no price_tier or conditional pricing. |
| Logistics & delivery confidence | ⚠️ | Basic status + delivery date; no granular states or tracking. |
| Inventory integrity (no oversell) | ❌ | No inventory; no reserve/decrement (empty bucket). |
| Product categorization (Energy vs. Cognac) | ❌ | Flat product; no expiry/vintage/attributes (hay vs. grass). |

---

## Recommended Implementation Order (CTO View)

1. **Inventory & empty bucket:** Add `Inventory` (productId, quantityOnHand, reserved, safetyStock?). On order create, run in `$transaction`: check availability, reserve or decrement, then create order. Reject or partial-fill when insufficient. Add low-stock alert (cron + threshold).
2. **Carrot price:** Add `Customer.priceTier` (or `CustomerProductPrice`) and resolve `unitPrice` in order flow by customer/product/tier. Show tier on customer profile.
3. **Delivery confidence:** Extend `OrderStatus` (e.g. DISPATCHED, IN_TRANSIT, DELIVERED); add optional `trackingNumber`, `deliverySlot`. Expose in order detail and list.
4. **Bulk/cart:** Cart state or "quick order" with line templates; optional "case" unit and repeat-order from history.
5. **Product attributes:** Optional `expiryDate`, `vintage`, or JSON `attributes` on Product; use in UI and in any FEFO or premium logic.
6. **Friday gate:** Configure DB pool; add rate limit on POST /api/orders; consider moving scrapers to a worker or separate process so API stays responsive.

This gives you a clear "where it fails" and a prioritized Technical Debt vs. Business Value path to fix the gaps.
