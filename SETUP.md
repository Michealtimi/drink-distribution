# Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (use free tier from Supabase or Railway)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Database Setup

1. Create a PostgreSQL database:
   - **Option A**: [Supabase](https://supabase.com) - Free tier
   - **Option B**: [Railway](https://railway.app) - Free tier
   - **Option C**: Local PostgreSQL

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   ```

## Step 3: Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Start Using the CRM

1. **Add Leads**: Go to `/leads/new` and manually add your first lead
2. **Generate Messages**: View a lead and click "Generate Message"
3. **Send via WhatsApp**: Copy message and open WhatsApp link
4. **Mark as Messaged**: After sending, the system auto-schedules follow-ups
5. **Convert to Customer**: When lead shows interest, convert to customer
6. **Create Orders**: For customers, create orders and track payments

## Next Steps (Phase 2)

- Set up lead scrapers for Google Maps, Instagram, directories
- Configure cron jobs for automated follow-up reminders
- Build route planning interface

## Troubleshooting

**Database connection error?**
- Verify `DATABASE_URL` in `.env` is correct
- Ensure database is accessible
- Check firewall settings if using cloud database

**Prisma errors?**
- Run `npm run db:generate` again
- Check Prisma schema syntax
- Verify database permissions

**Port 3000 already in use?**
- Change port: `npm run dev -- -p 3001`
- Or kill process using port 3000
