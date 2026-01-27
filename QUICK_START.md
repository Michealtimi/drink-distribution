# Quick Start Guide

## ✅ What Has Been Achieved

**ALL PHASES COMPLETE** - Phase 1, 2, and 3 are fully implemented!

### Phase 1 ✅
- Database schema
- CRM UI (Leads, Customers, Orders)
- Message generator
- Follow-up scheduler

### Phase 2 ✅
- Lead scrapers (Google Maps, Instagram, Directories)
- Auto lead import with deduplication
- Bulk operations
- Scraping UI

### Phase 3 ✅
- Cron jobs for follow-up automation
- Route planning UI
- Analytics dashboard
- Order detail pages with payment tracking

## 📦 Dependencies

**All dependencies are already in `package.json`:**
- ✅ `playwright` - For web scraping
- ✅ `node-cron` - For scheduled tasks
- ✅ `next`, `react`, `react-dom` - Frontend & Backend
- ✅ `@prisma/client`, `prisma` - Database
- ✅ `typescript`, `@types/*` - TypeScript support

## 🔌 WhatsApp API - NOT NEEDED

**Important:** The system does NOT use WhatsApp API because:
- Master prompt: "Zero paid APIs, Zero subscriptions"
- WhatsApp Business API requires paid subscription
- System is designed for **manual sending** (as per master prompt)

**What the system DOES:**
- ✅ Generates professional messages
- ✅ Creates WhatsApp web links (`wa.me/234...`)
- ✅ Provides "Copy message" + "Open WhatsApp" buttons
- ✅ You manually click send (by design)

This is **intentional** - manual sending ensures quality control and follows the zero-budget approach.

## 🚀 How to Start Development Server

### Step 1: Install Dependencies

Since `pnpm` is not installed, use `npm`:

```powershell
cd "c:\Users\mikolo\Desktop\Sales distribution"
npm install
```

### Step 2: Install Playwright Browsers

Playwright needs browser binaries:

```powershell
npx playwright install chromium
```

### Step 3: Set Up Database

1. Create a PostgreSQL database:
   - **Option A**: [Supabase](https://supabase.com) - Free tier
   - **Option B**: [Railway](https://railway.app) - Free tier

2. Copy `.env.example` to `.env`:
   ```powershell
   copy .env.example .env
   ```

3. Edit `.env` and add your database URL:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
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

## 📋 Available Commands

```powershell
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (database GUI)
```

## 🎯 What You Can Do Now

1. **Add Leads Manually**: `/leads/new`
2. **Scrape Leads**: `/scrapers` → Start scraping job
3. **Generate Messages**: View lead → "Generate Message" → Copy & open WhatsApp
4. **Plan Routes**: `/routes` → Create delivery routes
5. **View Analytics**: `/analytics` → See metrics
6. **Manage Orders**: `/orders` → View details & add payments

## 🏗️ Architecture

**Frontend + Backend in ONE:**
- Next.js App Router handles both
- `app/` = Frontend pages (React)
- `app/api/` = Backend API routes
- `lib/` = Shared utilities
- `prisma/` = Database schema

**No separate frontend/backend** - everything is in one codebase.

## 📡 All APIs Are Internal

**No external APIs needed:**
- All APIs are Next.js API routes (your own server)
- No API keys required
- No subscriptions required
- Zero cost (except free database hosting)

## ⚠️ Important Notes

1. **WhatsApp**: Manual sending only (by design, per master prompt)
2. **Scraping**: Slow and respectful (2 second delays, respects robots.txt)
3. **Database**: Must be PostgreSQL (Supabase/Railway free tier works)
4. **Playwright**: Requires browser installation (`npx playwright install chromium`)

## 🐛 Troubleshooting

**"pnpm not recognized"?**
- Use `npm` instead (already installed)
- All commands work the same: `npm run dev` instead of `pnpm dev`

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
