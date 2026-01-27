# Complete Testing Checklist

## 🎯 Pre-Launch Checklist

### 1. Environment Setup ✅

- [ ] **Install dependencies**
  ```powershell
  npm install
  ```

- [ ] **Install Playwright browsers**
  ```powershell
  npx playwright install chromium
  ```

- [ ] **Set up database**
  - [ ] Create PostgreSQL database (Supabase/Railway)
  - [ ] Copy `.env.example` to `.env`
  - [ ] Update `DATABASE_URL` in `.env`
  - [ ] Test connection

- [ ] **Initialize database**
  ```powershell
  npm run db:generate
  npm run db:push
  ```

- [ ] **Start dev server**
  ```powershell
  npm run dev
  ```
  - [ ] Server starts without errors
  - [ ] Can access http://localhost:3000

### 2. Database & Schema ✅

- [ ] **Verify schema**
  ```powershell
  npm run db:studio
  ```
  - [ ] All tables exist: Lead, Customer, Order, Payment, FollowUp, Route, ScrapingJob
  - [ ] Enums are correct: LeadStatus, OrderStatus, City, CustomerType, etc.

- [ ] **Test database connection**
  - [ ] Can query database
  - [ ] Can insert test data
  - [ ] Can read test data

### 3. Lead Management ✅

- [ ] **Manual lead entry**
  - [ ] Go to `/leads/new`
  - [ ] Fill form: name, phone, address, city, category
  - [ ] Submit form
  - [ ] Lead appears in `/leads` list
  - [ ] Lead status is `UNVERIFIED`

- [ ] **Lead list**
  - [ ] View all leads at `/leads`
  - [ ] Filter by status (SCRAPED, UNVERIFIED, VERIFIED, etc.)
  - [ ] Filter by city (LAGOS, ABUJA)
  - [ ] Search by name/phone

- [ ] **Lead detail page**
  - [ ] View lead at `/leads/[id]`
  - [ ] See all lead information
  - [ ] Update status dropdown works
  - [ ] "Generate Message" button works
  - [ ] Message appears with WhatsApp link
  - [ ] "Copy message" button works
  - [ ] "Open WhatsApp" button opens correct link

- [ ] **Lead conversion**
  - [ ] Click "Convert to Customer" on lead
  - [ ] Customer is created
  - [ ] Lead status changes to `CUSTOMER`
  - [ ] Can view customer at `/customers/[id]`

### 4. Message Generation ✅

- [ ] **First message**
  - [ ] Generate message for new lead
  - [ ] Message is human, commercial, no buzzwords
  - [ ] Includes trial offer (24-48 cans)
  - [ ] Includes payment terms (after delivery, 48h)
  - [ ] Includes clear next step

- [ ] **Follow-up messages**
  - [ ] Day 2 follow-up is generated
  - [ ] Day 5 follow-up is generated
  - [ ] Month-end follow-up is generated
  - [ ] Messages are short and polite
  - [ ] Messages propose specific next step

- [ ] **WhatsApp links**
  - [ ] Link format: `https://wa.me/234XXXXXXXXXX?text=...`
  - [ ] Phone number is normalized (234 format)
  - [ ] Message is URL-encoded
  - [ ] Link opens WhatsApp Web with pre-filled message

### 5. Scraping System ✅

- [ ] **Scraping UI**
  - [ ] Go to `/scrapers`
  - [ ] See scraping job history
  - [ ] Can start new scraping job

- [ ] **Google Maps scraper**
  - [ ] Start job: type=GOOGLE_MAPS, query="gym Lagos"
  - [ ] Job status: PENDING → RUNNING → COMPLETED
  - [ ] Leads are found and imported
  - [ ] Duplicates are detected
  - [ ] View job details at `/scrapers/[jobId]`
  - [ ] See leadsFound, leadsImported, duplicates counts

- [ ] **Deduplication**
  - [ ] Scrape same query twice
  - [ ] Second run detects duplicates
  - [ ] Only unique leads are imported
  - [ ] Duplicate count is accurate

- [ ] **Lead validation**
  - [ ] Invalid leads (no phone, no name) are rejected
  - [ ] Phone numbers are normalized
  - [ ] Areas are extracted from addresses
  - [ ] Categories are inferred correctly

### 6. Follow-up Automation ✅

- [ ] **Follow-up scheduling**
  - [ ] Message a lead (click "Generate Message")
  - [ ] Follow-ups are auto-created:
    - [ ] Day 2 follow-up scheduled
    - [ ] Day 5 follow-up scheduled
    - [ ] Month-end follow-up scheduled
  - [ ] Lead status changes to `MESSAGED`

- [ ] **Follow-up list**
  - [ ] Go to `/api/follow-ups/pending`
  - [ ] See pending follow-ups
  - [ ] See overdue follow-ups

- [ ] **Follow-up processing**
  - [ ] Call `/api/cron/follow-ups` (or set up cron)
  - [ ] Follow-ups are processed
  - [ ] Messages are generated
  - [ ] Follow-ups are marked as completed

### 7. Customer Management ✅

- [ ] **Customer list**
  - [ ] Go to `/customers`
  - [ ] See all customers
  - [ ] Filter by city, category

- [ ] **Customer detail**
  - [ ] View customer at `/customers/[id]`
  - [ ] See customer information
  - [ ] See order history
  - [ ] See payment history

### 8. Order Management ✅

- [ ] **Create order**
  - [ ] Go to customer detail page
  - [ ] Create order via API: `POST /api/orders`
  - [ ] Order appears in customer history
  - [ ] Order status is `PENDING`

- [ ] **Order list**
  - [ ] Go to `/orders`
  - [ ] See all orders
  - [ ] Filter by status

- [ ] **Order detail**
  - [ ] View order at `/orders/[id]`
  - [ ] See order items
  - [ ] See payment status
  - [ ] Add payment: `POST /api/orders/[id]/payments`
  - [ ] Payment progress bar updates

### 9. Route Planning ✅

- [ ] **Create route**
  - [ ] Go to `/routes/new`
  - [ ] Create route: name, day, area
  - [ ] Route appears in `/routes` list

- [ ] **Add customers to route**
  - [ ] View route at `/routes/[id]`
  - [ ] Add customer: `POST /api/routes/[id]/customers`
  - [ ] Customer appears in route
  - [ ] Reorder customers: `POST /api/routes/[id]/reorder`

- [ ] **Route management**
  - [ ] Update route details
  - [ ] Remove customer from route
  - [ ] Delete route

### 10. Analytics Dashboard ✅

- [ ] **Analytics page**
  - [ ] Go to `/analytics`
  - [ ] See overview metrics:
    - [ ] Total leads
    - [ ] Leads by status
    - [ ] Conversion rate
    - [ ] Total revenue
    - [ ] Pending payments
    - [ ] Follow-up status

- [ ] **Data accuracy**
  - [ ] Metrics match actual data
  - [ ] Charts display correctly
  - [ ] Filters work

### 11. API Endpoints ✅

Test all API endpoints:

- [ ] `GET /api/leads` - List leads
- [ ] `POST /api/leads` - Create lead
- [ ] `GET /api/leads/[id]` - Get lead
- [ ] `PATCH /api/leads/[id]` - Update lead
- [ ] `POST /api/leads/[id]/convert` - Convert to customer
- [ ] `POST /api/leads/[id]/message` - Generate message
- [ ] `POST /api/leads/bulk` - Bulk import
- [ ] `POST /api/scrapers/run` - Start scraping
- [ ] `GET /api/scrapers/status/[jobId]` - Get job status
- [ ] `GET /api/scrapers/history` - Get job history
- [ ] `GET /api/customers` - List customers
- [ ] `GET /api/customers/[id]` - Get customer
- [ ] `POST /api/orders` - Create order
- [ ] `GET /api/orders` - List orders
- [ ] `GET /api/orders/[id]` - Get order
- [ ] `POST /api/orders/[id]/payments` - Add payment
- [ ] `GET /api/routes` - List routes
- [ ] `POST /api/routes` - Create route
- [ ] `GET /api/routes/[id]` - Get route
- [ ] `POST /api/routes/[id]/customers` - Add customer
- [ ] `GET /api/analytics/overview` - Get analytics
- [ ] `GET /api/follow-ups/pending` - Get pending follow-ups
- [ ] `GET /api/cron/follow-ups` - Process follow-ups

### 12. Error Handling ✅

- [ ] **Invalid data**
  - [ ] Submit form with missing required fields
  - [ ] System shows error message
  - [ ] No crash

- [ ] **Database errors**
  - [ ] Disconnect database
  - [ ] System handles gracefully
  - [ ] Shows error message

- [ ] **Scraping errors**
  - [ ] Invalid scraper type
  - [ ] Network error during scraping
  - [ ] Job status shows `FAILED`
  - [ ] Error message is logged

### 13. Performance ✅

- [ ] **Page load times**
  - [ ] Homepage loads < 2 seconds
  - [ ] Lead list loads < 3 seconds
  - [ ] Analytics loads < 3 seconds

- [ ] **Scraping performance**
  - [ ] Scraping job completes in reasonable time
  - [ ] Rate limiting works (2s delays)
  - [ ] No overwhelming target servers

### 14. Security ✅

- [ ] **Environment variables**
  - [ ] `.env` is in `.gitignore`
  - [ ] No secrets in code
  - [ ] Database URL is secure

- [ ] **Input validation**
  - [ ] Phone numbers are validated
  - [ ] SQL injection prevention (Prisma handles this)
  - [ ] XSS prevention (React handles this)

## 🚀 Production Readiness

### Before Going Live:

- [ ] **Database backup**
  - [ ] Set up automated backups
  - [ ] Test restore process

- [ ] **Environment variables**
  - [ ] Production `.env` configured
  - [ ] Database URL is production URL
  - [ ] No development URLs

- [ ] **Cron jobs**
  - [ ] Set up Vercel cron (or server cron)
  - [ ] Test follow-up automation
  - [ ] Test scraping scheduler (if using)

- [ ] **Monitoring**
  - [ ] Set up error logging
  - [ ] Monitor scraping jobs
  - [ ] Monitor API performance

- [ ] **Documentation**
  - [ ] User guide for team
  - [ ] API documentation
  - [ ] Troubleshooting guide

## ✅ Quick Test Script

Run this to test core functionality:

```powershell
# 1. Start server
npm run dev

# 2. In another terminal, test APIs:
# Create lead
curl -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" -d '{"name":"Test Gym","phone":"2348012345678","city":"LAGOS","category":"GYM"}'

# Get leads
curl http://localhost:3000/api/leads

# Generate message
curl -X POST http://localhost:3000/api/leads/[LEAD_ID]/message

# Check analytics
curl http://localhost:3000/api/analytics/overview
```

## 🎯 Success Criteria

System is ready when:
- ✅ All checklist items pass
- ✅ Can scrape leads from Google Maps
- ✅ Can generate and send messages manually
- ✅ Can track orders and payments
- ✅ Can plan delivery routes
- ✅ Analytics show accurate data
- ✅ No critical errors in console
