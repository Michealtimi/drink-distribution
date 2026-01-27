# Setup Instructions - Prisma Client and Scraper Setup

## ⚠️ Important Note

The automated terminal execution encountered a Git Bash compatibility issue on Windows. I've created setup scripts that you can run manually to complete the setup.

## ✅ What's Already Verified

1. **`.env` file exists** and contains a valid `DATABASE_URL` (Neon PostgreSQL)
2. **`package.json`** has the required scripts configured:
   - `db:generate` - Generates Prisma client
   - `db:push` - Pushes schema to database
3. **Prisma schema** is properly configured in `prisma/schema.prisma`
4. **Playwright** is listed in dependencies

## 🚀 Quick Setup (Choose One Method)

### Method 1: Run the Batch File (Easiest for Windows)

1. Open Command Prompt or PowerShell in the project directory
2. Run: `setup.bat`
3. The script will execute all 4 steps automatically

### Method 2: Run the PowerShell Script

1. Open PowerShell in the project directory
2. Run: `.\setup.ps1`
3. If you get an execution policy error, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
4. Then run: `.\setup.ps1` again

### Method 3: Run Commands Manually

Execute these commands in order:

```powershell
# Step 1: Generate Prisma Client
pnpm run db:generate

# Step 2: Push database schema (creates tables)
pnpm run db:push

# Step 3: Install Playwright Chromium browser
npx playwright install chromium

# Step 4: Restart dev server (if running)
# Stop current server (Ctrl+C) then:
pnpm dev
```

## 📋 What Each Step Does

### Step 1: Generate Prisma Client
- Creates the `.prisma/client` directory
- Generates TypeScript types from your schema
- **Fixes**: `Cannot find module '.prisma/client/default'` error

### Step 2: Push Database Schema
- Creates all database tables in your Neon PostgreSQL database
- Based on `prisma/schema.prisma`
- **Creates**: Lead, Customer, Order, Route, ScrapingJob, etc.

### Step 3: Install Playwright Browser
- Downloads Chromium browser needed for scrapers
- **Required for**: Google Maps, Instagram, Directory scrapers

### Step 4: Restart Dev Server
- Restarts Next.js dev server to pick up Prisma client
- **After this**: All API routes using Prisma will work

## ✅ Verification

After running the setup, verify everything works:

1. **Check Prisma Client**: Look for `node_modules/.prisma/client/` directory
2. **Check Database**: Run `pnpm run db:studio` to open Prisma Studio and see your tables
3. **Test Scraper**: Try running a scraper from `/scrapers` page
4. **Check API Routes**: Visit `/api/leads` to see if Prisma queries work

## 🐛 Troubleshooting

### If `pnpm` doesn't work:
- Try `npm` instead (replace `pnpm` with `npm` in all commands)
- Make sure Node.js is installed: `node --version`

### If database connection fails:
- Verify `DATABASE_URL` in `.env` is correct
- Check if your Neon database is active
- Test connection: `pnpm run db:studio`

### If Playwright installation fails:
- Make sure you have internet connection
- Try: `npx playwright install chromium --with-deps` (Linux/Mac)
- On Windows, Chromium should install automatically

## 📝 Next Steps After Setup

1. ✅ Prisma client generated
2. ✅ Database tables created
3. ✅ Playwright browser installed
4. ✅ Dev server restarted

**You're ready to:**
- Start scraping leads from `/scrapers`
- Add leads manually from `/leads/new`
- Generate messages and follow-ups
- Track customers and orders
