# How Scraping & Verification Works

## 🔍 Scraping Process

### Step 1: Start Scraping Job
- Go to `/scrapers` page
- Select scraper type: Google Maps, Instagram, or Directory
- Enter search query (e.g., "gym Lagos", "event center Abuja")
- Select city and category (optional)
- Click "Start Scraping"

### Step 2: Scraper Execution
Each scraper works differently:

#### **Google Maps Scraper** (`lib/scrapers/google-maps-scraper.ts`)
1. Launches headless Chromium browser (Playwright)
2. Navigates to Google Maps search URL
3. Scrolls to load more results (3 scrolls)
4. Extracts from each listing:
   - Business name
   - Phone number
   - Address
5. Normalizes phone to Nigerian format (`234...`)
6. Extracts area from address (e.g., "Victoria Island", "Lekki")
7. Infers category from name/address (GYM, EVENT_CENTER, etc.)
8. Validates: name, phone, city, category must exist
9. Rate limiting: 2 second delay between requests

#### **Instagram Scraper** (`lib/scrapers/instagram-scraper.ts`)
1. Launches browser
2. Searches Instagram for business profiles/tags
3. Extracts business info from profile pages
4. Same normalization and validation as Google Maps

#### **Directory Scraper** (`lib/scrapers/directory-scraper.ts`)
1. Generic scraper for Nigerian business directories
2. Configurable URLs and selectors
3. Extracts business listings

### Step 3: Data Validation (`lib/scrapers/base-scraper.ts`)
Each scraped lead is validated:
- ✅ Name exists and not empty
- ✅ Phone exists and has at least 10 digits
- ✅ City is set (LAGOS or ABUJA)
- ✅ Category is inferred or set

Phone normalization:
- Removes non-digits
- Handles `234` country code
- Handles `0` prefix
- Returns format: `234XXXXXXXXXX`

### Step 4: Deduplication (`lib/lead-deduplicator.ts`)
Before importing, system checks for duplicates:

1. **Exact phone match** (primary check)
   - If phone number exists → duplicate

2. **Name + Area match** (fuzzy)
   - If same name + same area + same city → duplicate
   - Case-insensitive matching

3. **Name similarity** (if no area)
   - Calculates similarity score (0-1)
   - If similarity > 0.8 → duplicate
   - Prevents false positives

### Step 5: Bulk Import (`lib/scrapers/scraper-manager.ts`)
- Unique leads are imported to database
- Status set to `SCRAPED`
- Source recorded (e.g., "Google Maps")
- Duplicates are logged but not imported
- Job status updated: `PENDING` → `RUNNING` → `COMPLETED`

## ✅ Verification Process

### Automatic Verification (During Scraping)
- ✅ Phone format validation
- ✅ Name validation
- ✅ Duplicate detection
- ✅ Category inference

### Manual Verification (After Scraping)
1. Go to `/leads` page
2. Filter by status: `SCRAPED` or `UNVERIFIED`
3. Review each lead:
   - Check phone number format
   - Verify business name
   - Confirm category is correct
   - Check if has WhatsApp (manual check)
4. Update status:
   - `SCRAPED` → `VERIFIED` (if valid)
   - `SCRAPED` → `INVALID` (if invalid)

### Verification Checklist
- [ ] Phone number is valid Nigerian format
- [ ] Business name makes sense
- [ ] Category matches business type
- [ ] Area is correct (if available)
- [ ] Not a duplicate

## 📊 Scraping Job Tracking

Each scraping job creates a `ScrapingJob` record:
- `id` - Job ID
- `type` - GOOGLE_MAPS, INSTAGRAM, DIRECTORY
- `status` - PENDING, RUNNING, COMPLETED, FAILED
- `query` - Search query used
- `city` - LAGOS or ABUJA
- `category` - Customer type filter
- `leadsFound` - Total leads scraped
- `leadsImported` - Unique leads imported
- `duplicates` - Number of duplicates found
- `errors` - JSON array of errors
- `startedAt` - When job started
- `completedAt` - When job finished

View job status: `/scrapers/[jobId]`

## ⚙️ Configuration

### Rate Limiting
- Default: 2 seconds between requests
- Configurable in scraper config
- Prevents overwhelming target servers

### Max Results
- Default: 50 leads per job
- Configurable per scraper
- Prevents excessive scraping

### Ethical Scraping
- ✅ Slow, respectful scraping (2s delays)
- ✅ Respects robots.txt (implemented in base scraper)
- ✅ Only public data
- ✅ No login required (for most sources)

## 🐛 Troubleshooting

**No leads found?**
- Check if search query is too specific
- Verify target website structure hasn't changed
- Check browser console for errors

**Many duplicates?**
- Normal if scraping same area multiple times
- System automatically filters them
- Check deduplication logic if needed

**Scraping fails?**
- Check Playwright browsers installed: `npx playwright install chromium`
- Check internet connection
- Verify target website is accessible
- Check job errors in `/scrapers/[jobId]`
