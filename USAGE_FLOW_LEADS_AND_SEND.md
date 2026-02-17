# Usage Flow: Find Leads → Sort to the Right Group → Send

This document describes how to **find leads**, **sort/filter them into the right groups**, and **send messages** in this CRM.

---

## 1. Find leads (how leads get into the system)

Leads enter the CRM in three ways:

| Method | Where | What you do |
|--------|--------|--------------|
| **Web scrapers** | **Scrapers** (nav → Web scrapers) | Pick one or more scrapers (Google Maps, Business Directory, Finelib), enter a **query** (e.g. `gym`, `event center`, `lounge`), choose **City** (Lagos/Abuja), optionally tick **Run for all areas**, then click **Start**. New leads appear under **Leads** and in **Job history** below. |
| **Add a single lead** | **Leads** → **Add Lead** | Fill name, phone or email, city, category, etc. and save. |
| **Bulk / CSV** | **Imports** or **Leads** (bulk/from-contacts APIs) | Use **Imports** to upload a CSV, or use the bulk/from-contacts API to create many leads at once. |

After scraping or import, new leads are **deduplicated by phone** (and name/area), then **auto-validated** when possible. They start as **SCRAPED** or **UNVERIFIED**.

---

## 2. Sort leads into the right group (filter & sort)

All leads are listed on **Leads** (`/leads`). You group and sort them like this:

### 2.1 Filter by status (the main “group”)

**Status** is the main way to group leads. Use the **tabs** at the top or the **Status** dropdown:

| Status | Meaning |
|--------|--------|
| **All** | No filter; every lead. |
| **Scraped** | Just imported from a scraper; not yet verified. |
| **Unverified** | Not yet checked (phone/validity). |
| **Verified** | Phone/contact checked; ready to message. |
| **Messaged** | First message sent (by you via WhatsApp). |
| **Interested** | They showed interest. |
| **Customer** | Converted to customer (has a Customer record). |
| **Repeat** | Repeat customer. |
| **Invalid** | Bad/no phone or not relevant. |

**Flow in practice:**  
Scraped/Unverified → (use **Auto-Validate All** or **Validate Selected**) → Verified → then message → Messaged → Interested → Convert to customer.

### 2.2 Filter by city and category

- **City:** **Lagos** or **Abuja** (or All).
- **Category:** Gyms, Event Center, Club, Lounge, Office, Small Retailer, etc. (or All).

Use the **City** and **Category** dropdowns next to the status filters to narrow the list (e.g. “Verified + Lagos + Gym”).

### 2.3 Search

Use the **search bar** to filter by **name, phone, email, address, or area**. This filters the current list (after status/city/category) on the client.

### 2.4 Sort order

- **Sort by:** **Priority** (recommended), **Date**, **Name**, **Status**, or **City**.
- **Order:** **Desc** (newest / highest priority first) or **Asc**.

**Priority** uses your business rules: e.g. Distributor > Supplier > Gyms > Event centers > Clubs > Lounges > … then by date. So “sort by Priority, desc” puts the right groups first.

---

## 3. Send a message (per lead)

Sending is **manual**: you get a **message text** and a **WhatsApp link**; you send yourself (copy + open WhatsApp or use optional WhatsApp integration).

### 3.1 From the Leads list

1. Click a **lead row** to open the **lead detail** page (`/leads/[id]`).

### 3.2 On the lead detail page

1. **Generate message**  
   Click **Generate message** (or similar). The app calls `GET /api/leads/[id]/message` and shows:
   - A **message** tailored to the lead’s status (first contact or follow-up) and context (name, category, city, area).
   - A **Copy message** button and an **Open WhatsApp** link (`wa.me/...` with the message pre-filled).

2. **Copy and open WhatsApp**  
   - Click **Copy message**, then click **Open WhatsApp**.  
   - WhatsApp opens with the number and message; you send manually.

3. **Mark as “Messaged” and schedule follow-ups**  
   - After you’ve sent, click **Mark as messaged** (or the action that calls `POST /api/leads/[id]/message`).  
   - The lead’s status becomes **MESSAGED**, and the system **schedules follow-ups** (Day 2, Day 5, Month-end).  
   - Later you can go to **Follow-ups** to see due tasks and generate follow-up messages the same way (copy + open WhatsApp).

### 3.3 Optional: automatic welcome message (WhatsApp)

If you turned on **WhatsApp integration** and set `WHATSAPP_WELCOME_ENABLED=true` in `.env`, then when you create a **new lead** (Add Lead or API) **with a phone number**, the app can send a **welcome message** automatically. You still do all other outreach manually (first message from list, follow-ups) as above.

---

## 4. End-to-end flow (summary)

```
1. FIND
   Scrapers (query + city)  OR  Add Lead  OR  Import CSV
        ↓
   Leads appear (SCRAPED / UNVERIFIED)

2. SORT TO THE RIGHT GROUP
   • Status tabs: e.g. Verified (ready to message)
   • City: Lagos / Abuja
   • Category: Gym, Event center, etc.
   • Sort by: Priority (desc) so best segments are on top

3. SEND
   • Open a lead → Generate message
   • Copy message → Open WhatsApp → send yourself
   • Mark as messaged → status = MESSAGED, follow-ups scheduled
   • Later: Follow-ups page → generate follow-up message → copy → WhatsApp
```

---

## 5. Quick reference

| Goal | Where | Action |
|------|--------|--------|
| Get new leads | **Scrapers** | Query (e.g. gym, event center), City, Start. |
| See leads by stage | **Leads** | Click status tab (Scraped, Verified, Messaged, …). |
| Focus Lagos gyms | **Leads** | Status = Verified, City = Lagos, Category = Gym. |
| Best leads first | **Leads** | Sort by **Priority**, order **Desc**. |
| Send first message | **Leads** → open lead | Generate message → Copy → Open WhatsApp → send → Mark as messaged. |
| Send follow-up | **Follow-ups** or **Leads** → open lead | Generate message (follow-up text) → Copy → Open WhatsApp. |
| Turn lead into customer | **Leads** → open lead | **Convert to customer** (creates Customer, links Orders). |

---

## 6. Status flow (pipeline)

```
SCRAPED → UNVERIFIED → VERIFIED → MESSAGED → INTERESTED → CUSTOMER → REPEAT_CUSTOMER
    \___________________/              |
         (validate)                    |
                                       ↓
                                    INVALID (if not relevant / bad contact)
```

- **Validate** (Auto-Validate All or Validate Selected) moves Scraped/Unverified to **Verified** or **Invalid**.
- **Mark as messaged** moves to **MESSAGED** and creates follow-up tasks.
- You can change status manually on the lead detail page (e.g. set to **INTERESTED** when they reply).
- **Convert to customer** creates a Customer record and links the lead to orders.

This is the usage flow for **find lead → sort to the right group → send** in your project.
