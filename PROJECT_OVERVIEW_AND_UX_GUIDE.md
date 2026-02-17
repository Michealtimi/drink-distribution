# Project Overview & UX Guide

**Perspective:** World-class Software Engineer + Product Manager  
**Purpose:** Everything about this project, how to use it, and how to make it better for successful usage and great UX.

---

# Part 1: What This Project Is

## 1.1 Product in One Sentence

A **single-user, zero-subscription CRM** for FMCG beverage distribution in **Lagos and Abuja**: find leads (scrapers + manual), validate and group them, generate messages, send via WhatsApp (manual or optional auto-welcome), track follow-ups, convert to customers, and manage orders and routes.

## 1.2 Business Context

| Dimension | Detail |
|-----------|--------|
| **Products** | Red Bull, one alternative energy drink, Cognac; optional bottled water. |
| **Target customers** | Gyms, event centers, clubs & lounges, offices, small retailers. |
| **Geography** | Lagos, Abuja (with area/LGA breakdown). |
| **Trade terms** | Trial 24–48 cans, payment after delivery (max 48h); no long credit. |
| **Positioning** | Reliable distributor, no hype, operationally credible messaging. |

## 1.3 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18 |
| **Backend** | Next.js API routes (Node) |
| **Database** | PostgreSQL (e.g. Supabase / Railway), Prisma ORM |
| **Scraping** | Playwright (Chromium) – Google Maps, Directory, Finelib |
| **Scheduling** | Cron (e.g. Vercel cron or node-cron) for follow-up processing |
| **Optional** | whatsapp-web.js for optional welcome message on new lead |

## 1.4 Main Modules (by Nav)

| Section | What it does |
|---------|----------------|
| **Home** | Dashboard: total leads, customers, orders, revenue, conversion rate, pending/overdue follow-ups, alerts. |
| **Leads** | List, filter (status/city/category), sort, search, validate, add lead, open detail, generate message, mark messaged, convert to customer. |
| **Customers** | List of converted customers; link to orders and routes. |
| **Orders** | List and detail; payments; order number, status, delivery. |
| **Routes** | Delivery routes (city, day, area); attach customers. |
| **Suppliers** | Supplier list; link to products. |
| **Products** | Product catalog (energy drinks, etc.); link to suppliers. |
| **Businesses** | Business entities; can link to leads/customers. |
| **Follow-ups** | Detail page per follow-up (e.g. `/follow-ups/[id]`); list is via API/cron or implied from Leads. |
| **Templates** | Message templates (first contact, follow-up day 2/5, month-end) with variables. |
| **Imports** | CSV import history. |
| **Scrapers** | Run internal scrapers (query + city + optional “all areas”); job history. |
| **Analytics** | Overview stats and charts. |

---

# Part 2: End-to-End Flow (How to Use It)

## 2.1 High-Level Pipeline

```
[FIND LEADS] → [VALIDATE & GROUP] → [SEND MESSAGE] → [FOLLOW UP] → [CONVERT] → [ORDER & ROUTE]
```

## 2.2 Step-by-Step Usage

### Step 1: Find leads

- **Option A – Scrapers**  
  Go to **Scrapers** → choose one or more (Google Maps, Directory, Finelib) → enter **query** (e.g. `gym`, `event center`, `lounge`) → select **City** → optionally **Run for all areas** → **Start**.  
  New leads appear under **Leads** (status **SCRAPED**); duplicates are skipped.

- **Option B – Manual**  
  **Leads** → **Add Lead** → fill name, phone or email, city, category → Save.

- **Option C – Bulk**  
  **Imports** (or bulk/from-contacts API) to bring in many leads at once.

### Step 2: Validate and group (sort to the right group)

- On **Leads**, use:
  - **Status tabs**: Scraped, Unverified, Verified, Messaged, Interested, Customer, Repeat, Invalid.
  - **Auto-Validate All** or **Validate Selected** to move Scraped/Unverified → Verified or Invalid.
  - **City** and **Category** dropdowns to narrow (e.g. Lagos + Gym).
  - **Sort by**: **Priority** (recommended) or Date, Name, Status, City.
  - **Search** for name, phone, email, address, area.

Result: you see “the right group” (e.g. Verified Lagos gyms, sorted by priority).

### Step 3: Send first message

- Open a lead (click row) → **Generate message** → **Copy message** → **Open WhatsApp** (wa.me link) → send the message yourself.
- Click **Mark as messaged** so status becomes **MESSAGED** and the system creates follow-ups (Day 2, Day 5, Month-end).

Optional: if WhatsApp integration is on and `WHATSAPP_WELCOME_ENABLED=true`, **new** leads with phone get an automatic welcome; all other sending stays manual.

### Step 4: Follow up

- **Cron** (e.g. daily) can process due follow-ups and prepare messages (stored on the follow-up record).
- You can open a follow-up (e.g. from **Follow-ups** or from the lead) and generate the follow-up message → Copy → Open WhatsApp.
- Dashboard shows **Pending** and **Overdue** follow-ups; “View Leads” takes you to leads (e.g. Verified) to work from.

### Step 5: Convert and operate

- When a lead is interested: set status to **Interested** (or leave as Messaged), then **Convert to customer** from the lead detail page.
- **Customers** and **Orders** then drive delivery and **Routes**; **Suppliers** and **Products** support catalog and ordering.

## 2.3 Status Flow (Lead pipeline)

```
SCRAPED → UNVERIFIED → VERIFIED → MESSAGED → INTERESTED → CUSTOMER → REPEAT_CUSTOMER
     \_____________/        |           |
      (validate)            |           +→ INVALID (bad contact)
                            +→ (mark as messaged → follow-ups created)
```

## 2.4 Where Things Live

| Goal | Where to go |
|------|-------------|
| Get new leads | Scrapers |
| See leads by stage | Leads (status tabs + filters) |
| Send first message | Leads → open lead → Generate message → Copy → Open WhatsApp → Mark as messaged |
| See what to follow up | Dashboard (Pending/Overdue) or Leads filtered |
| Convert to customer | Leads → open lead → Convert to customer |
| Manage orders | Orders |
| Plan delivery | Routes |

---

# Part 3: Advice for Better UX and Successful Usage

## 3.1 Product / UX Improvements (Prioritised)

### P0 – Critical for success

| Improvement | Why | How (concise) |
|-------------|-----|----------------|
| **Onboarding / first-run guide** | New user doesn’t know: scrape first vs add lead, what “Verified” means, or that “Mark as messaged” creates follow-ups. | Add a short **“Getting started”** (modal or page): 1) Run a scraper or add a lead, 2) Validate, 3) Open a lead → Generate message → WhatsApp → Mark as messaged. Link from Home or Nav. |
| **Single “today’s work” view** | User has to jump between Dashboard, Leads, Follow-ups. | One **“Today”** or **“Action queue”** view: due/overdue follow-ups + suggested “Verified leads to message” (e.g. top 10 by priority). One click to open lead and generate message. |
| **Clear CTA on lead detail** | “Generate message” and “Mark as messaged” can be missed or misunderstood. | One primary path: **“Prepare & send”** (or “Message this lead”) that: generates message, shows Copy + Open WhatsApp, then a clear **“I’ve sent it – mark as messaged”** button. |

### P1 – High impact

| Improvement | Why | How (concise) |
|-------------|-----|----------------|
| **Follow-ups list page** | Nav has “Follow-ups” but list is not obvious (only detail page exists). | Add **Follow-ups** list page: show pending and overdue by date, link to lead and “Generate message”. Reuse `/api/follow-ups/pending` or equivalent. |
| **Status explained in UI** | Terms like SCRAPED, VERIFIED, MESSAGED are internal. | Short tooltip or helper text next to each status: e.g. “Verified = ready to message”, “Messaged = first WhatsApp sent”. |
| **Empty states with next step** | Empty lists can feel dead. | Per section: “No leads yet → Go to Scrapers” / “No follow-ups today → Check Verified leads”. |
| **Bulk “mark as messaged”** | Sending to many leads is repetitive. | On Leads: select multiple Verified leads → **“Mark selected as messaged”** (with confirmation). Still send manually, but status update in one go. |

### P2 – Polish and trust

| Improvement | Why | How (concise) |
|-------------|-----|----------------|
| **Scraper job feedback** | User doesn’t know when job finished or how many leads landed. | After Start: “Job started. We’ll add leads to Leads when done.” In Job history: “X leads imported” and link “View in Leads” (filter by source or date). Toast when a running job completes (if polling or SSE). |
| **Message preview before send** | User wants to double-check tone and content. | Lead detail: show generated message clearly; “Edit message” (optional) then Copy / Open WhatsApp. |
| **Keyboard / accessibility** | Power users and accessibility. | Tab order, “Generate message” and “Mark as messaged” reachable by keyboard; one clear focus per screen. |
| **Mobile-friendly Leads list** | Used on phone in the field. | Responsive table (cards on small screen), sticky “Generate message” / “Open WhatsApp” on lead card. |

## 3.2 UX Principles to Apply

- **One primary path per goal**  
  “I want to message a lead” → one flow: open lead → one “Message this lead” path → Copy + WhatsApp → one “Mark as messaged” action.

- **Progressive disclosure**  
  Default: simple (tabs, sort by priority). Advanced: filters, bulk validate, bulk mark messaged.

- **Feedback after every action**  
  “Lead marked as messaged. Follow-ups scheduled for Day 2, Day 5, Month-end.” / “X leads validated: Y verified, Z invalid.”

- **Consistent language**  
  Same labels in nav, dashboard, and Leads (e.g. “Follow-ups” everywhere; “Mark as messaged” not “Submit” or “Done”).

- **Error and empty states**  
  “Couldn’t load leads. Check connection.” “No Verified leads. Run validation or add leads.”

## 3.3 Success Metrics to Watch (for you as PM)

| Metric | Why it matters |
|--------|----------------|
| **Leads → Messaged** | Are users actually using the “message” flow? |
| **Messaged → Interested / Customer** | Is the message + follow-up flow converting? |
| **Scraper runs per week** | Is the pipeline fed regularly? |
| **Time to first message** | From lead created to “mark as messaged” – lower is better. |

You can derive these from existing data (lead status, createdAt, follow-up creation) without new features.

## 3.4 Technical Quick Wins (Engineer)

| Change | Benefit |
|--------|---------|
| **Query param for Leads** | Support `/leads?status=VERIFIED&city=LAGOS` so Dashboard “View Leads” and “Pending follow-ups” open the right filter. |
| **Follow-ups list page** | Consume pending/overdue API and render a list with links to lead and “Generate message”. |
| **One “Message lead” component** | Reusable block: fetch message, show text, Copy + Open WhatsApp + “Mark as messaged”. Use on lead detail and (later) on Today view. |

---

# Part 4: Summary

## What the project is

A **single-user FMCG beverage distribution CRM** for Lagos/Abuja: scrapers + manual leads, validation, message generation, manual (or optional auto) WhatsApp, follow-ups, conversion to customers, orders, and routes. Built with Next.js, Prisma, Playwright scrapers, and optional whatsapp-web.js.

## How to use it (flow)

1. **Find:** Scrapers or Add Lead or Import.  
2. **Group:** Leads → status tabs + city/category + sort by Priority.  
3. **Validate:** Auto-Validate All or Validate Selected.  
4. **Send:** Open lead → Generate message → Copy → Open WhatsApp → send → Mark as messaged.  
5. **Follow up:** Use dashboard and/or Follow-ups; generate follow-up message → Copy → WhatsApp.  
6. **Convert:** Convert to customer → manage in Customers, Orders, Routes.

## How to make it better for UX and success

- Add **onboarding** and a **single “today’s work” view**.  
- Make the **lead messaging path** obvious (one primary CTA, clear “Mark as messaged”).  
- Add a **Follow-ups list page** and **status explanations**.  
- Improve **empty states**, **scraper feedback**, and **query-param filters** for Leads.  
- Keep **one primary path per goal**, **clear feedback**, and **consistent wording** across the app.

This gives you everything about the project, the full flow to use it, and concrete advice for better UX and successful usage.
