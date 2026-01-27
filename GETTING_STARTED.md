# Getting Started - Complete Guide

## 📋 Quick Answers to Your Questions

### 1. How Does It Scrape and Verify?

**Scraping Process:**
1. You start a scraping job from `/scrapers` page
2. System uses Playwright to open Google Maps/Instagram/Directory
3. Extracts: business name, phone, address, area
4. Normalizes phone to Nigerian format (`234...`)
5. Infers category (GYM, EVENT_CENTER, etc.)
6. Validates: name, phone, city, category must exist

**Verification Process:**
1. **Automatic:** During scraping, system validates phone format, checks for duplicates
2. **Deduplication:** Checks by phone (exact) and name+area (fuzzy match)
3. **Manual:** After scraping, you review leads at `/leads` and mark as VERIFIED or INVALID

**See `SCRAPING_AND_VERIFICATION.md` for full details.**

### 2. WhatsApp API - Free 20 Messages/Day?

**Answer: NO free tier exists.**

WhatsApp Business API does NOT have a free tier with 20 messages/day. The actual free options are:
- Service messages (free)
- Messages within 72-hour customer service window (free)
- But requires paid subscription to access

**Current System (Recommended):**
- ✅ Generates messages
- ✅ Creates WhatsApp web links (`wa.me/...`)
- ✅ You manually click send
- ✅ **100% FREE** - No API needed
- ✅ Follows your "Zero paid APIs" rule

**For 20 messages/day:** Manual sending is perfectly manageable and free.

**See `WHATSAPP_API_OPTIONS.md` for all options.**

### 3. What's Needed to Seal This and Test It?

**Complete testing checklist in `TESTING_CHECKLIST.md`**

**Quick Start:**
1. Install dependencies: `npm install`
2. Install Playwright: `npx playwright install chromium`
3. Set up database (Supabase/Railway free tier)
4. Update `.env` with `DATABASE_URL`
5. Initialize: `npm run db:generate && npm run db:push`
6. Start server: `npm run dev`
7. Test core features (see checklist)

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```powershell
cd "c:\Users\mikolo\Desktop\Sales distribution"
npm install
```

### Step 2: Install Playwright Browsers

```powershell   npx playwright install chromium
```

### Step 3: Set Up Database

1. **Create PostgreSQL database:**
   - Option A: [Supabase](https://supabase.com) - Free tier
   - Option B: [Railway](https://railway.app) - Free tier

2. **Get connection string:**
   - Format: `postgresql://user:password@host:5432/database?schema=public`

3. **Create `.env` file:**
   ```powershell
   copy .env.example .env
   ```

4. **Edit `.env`:**
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Step 4: Initialize Database

```powershell
npm run db:generate
npm run db:push
```

### Step 5: Start Development Server

```powershell
npm run dev
```

Open **http://localhost:3000** in your browser.

## ✅ Testing Checklist (Quick Version)

### Core Features Test:

- [ ] **Manual Lead Entry**
  - Go to `/leads/new`
  - Create a test lead
  - Verify it appears in `/leads`

- [ ] **Message Generation**
  - View lead detail
  - Click "Generate Message"
  - Verify message appears
  - Click "Open WhatsApp" - should open WhatsApp Web

- [ ] **Scraping**
  - Go to `/scrapers`
  - Start Google Maps scraping: query="gym Lagos"
  - Wait for job to complete
  - Verify leads are imported

- [ ] **Customer & Orders**
  - Convert a lead to customer
  - Create an order
  - Add payment
  - Verify payment tracking

- [ ] **Routes**
  - Create a route
  - Add customers to route
  - Verify route planning works

- [ ] **Analytics**
  - Go to `/analytics`
  - Verify metrics display correctly

**Full checklist: `TESTING_CHECKLIST.md`**

## 📚 Documentation Files

- **`CURRENT_STATUS.md`** - What's implemented
- **`QUICK_START.md`** - Quick start guide
- **`SCRAPING_AND_VERIFICATION.md`** - How scraping works
- **`WHATSAPP_API_OPTIONS.md`** - WhatsApp API info
- **`TESTING_CHECKLIST.md`** - Complete testing guide
- **`GETTING_STARTED.md`** - This file

## 🎯 What You Can Do Right Now

1. **Add Leads Manually:** `/leads/new`
2. **Scrape Leads:** `/scrapers` → Start scraping job
3. **Generate Messages:** View lead → "Generate Message" → Copy & open WhatsApp
4. **Track Customers:** Convert leads → Create orders → Track payments
5. **Plan Routes:** `/routes` → Create delivery routes
6. **View Analytics:** `/analytics` → See metrics

## ⚠️ Important Notes

1. **WhatsApp:** Manual sending only (by design, free, no API needed)
2. **Database:** Must be PostgreSQL (Supabase/Railway free tier works)
3. **Scraping:** Slow and respectful (2s delays, respects robots.txt)
4. **Playwright:** Requires browser installation (`npx playwright install chromium`)

## 🐛 Troubleshooting

**"pnpm not recognized"?**
- Use `npm` instead (already installed)
- All commands work: `npm run dev` instead of `pnpm dev`

**Database connection error?**
- Check `.env` file exists and has correct `DATABASE_URL`
- Verify database is accessible
- Check firewall if using cloud database

**Playwright errors?**
- Run `npx playwright install chromium`
- Make sure you're in the project directory

**Port 3000 in use?**
- Kill the process using port 3000
- Or change port: `npm run dev -- -p 3001`

## 🎉 You're Ready!

Once you complete the setup steps above, you can:
- Start scraping leads
- Generate messages
- Track customers and orders
- Plan delivery routes
- View analytics

**Everything is implemented and ready to test!**
