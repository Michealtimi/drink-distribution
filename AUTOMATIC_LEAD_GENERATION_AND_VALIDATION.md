# Automatic Lead Generation, Sorting & Validation

## Overview

The system now automatically:
1. **Generates leads** through scraping (already existed, now enhanced)
2. **Validates leads** automatically after scraping
3. **Sorts leads** with multiple sorting options

## 🚀 Automatic Lead Generation

### How It Works

1. **Start Scraping Job** (`/scrapers` page)
   - Select scraper type (Google Maps, Instagram, Directory)
   - Enter search query
   - Select city and category (optional)
   - Click "Start Scraping"

2. **Automatic Processing**
   - Scraper extracts leads from source
   - Leads are deduplicated automatically
   - Leads are imported with status `SCRAPED`
   - **NEW**: Leads are automatically validated after import

### Scraping Sources

- **Google Maps**: Searches for businesses on Google Maps
- **Instagram**: Searches Instagram business profiles
- **Directory**: Scrapes Nigerian business directories

## ✅ Automatic Validation

### Validation Rules

The system automatically validates leads using these criteria:

1. **Phone Validation (30 points)**
   - Must start with `234` (Nigerian country code)
   - Must be exactly 13 digits (234 + 10 digits)
   - Cannot be all zeros or all ones

2. **Name Validation (20 points)**
   - Must be at least 2 characters
   - Cannot be all numbers
   - Cannot be generic terms (test, example, etc.)

3. **Address/Area (15 points)**
   - Prefers leads with both address and area
   - Minor penalty if only address (area can be inferred)

4. **Category (10 points)**
   - Penalty if category is `OTHER` (not specific)

5. **Source (10 points)**
   - Prefers leads with recorded source

6. **Duplicate Check (15 points)**
   - Checks for similar names in same area/city

### Validation Scoring

- **Score ≥ 80**: Automatically marked as `VERIFIED` ✅
- **Score 50-79**: Marked as `UNVERIFIED` (needs review)
- **Score < 50**: Marked as `INVALID` ❌

### When Validation Happens

1. **After Scraping**: All newly scraped leads are automatically validated
2. **Manual Trigger**: Click "Auto-Validate All" button on `/leads` page
3. **API Endpoint**: `POST /api/leads/validate` - validates all `SCRAPED` leads

## 📊 Automatic Sorting

### Sort Options

On the `/leads` page, you can now sort by:

1. **Date Created** (default)
   - Newest first (desc) or oldest first (asc)

2. **Name**
   - Alphabetical order (A-Z or Z-A)

3. **Status**
   - Groups by status (VERIFIED, UNVERIFIED, etc.)

4. **City**
   - Groups by city (LAGOS, ABUJA)

5. **Category**
   - Groups by business type (GYM, EVENT_CENTER, etc.)

### How to Use Sorting

1. Go to `/leads` page
2. Use the "Sort by" dropdown to select field
3. Use "Sort Order" dropdown to select ascending/descending
4. Leads automatically refresh with new sort order

## 🎯 Complete Workflow

### Automated Flow

```
1. Start Scraping Job
   ↓
2. Scraper extracts leads
   ↓
3. Deduplication (removes duplicates)
   ↓
4. Import to database (status: SCRAPED)
   ↓
5. Automatic Validation
   ↓
6. Status updated:
   - VERIFIED (score ≥ 80)
   - UNVERIFIED (score 50-79)
   - INVALID (score < 50)
   ↓
7. Leads appear in /leads page (sorted by date)
```

### Manual Steps

1. **Review Verified Leads**: Go to `/leads`, filter by `VERIFIED`
2. **Generate Messages**: Click on lead → "Generate Message"
3. **Send via WhatsApp**: Copy message and send manually
4. **Update Status**: Mark as `MESSAGED` → `INTERESTED` → `CUSTOMER`

## 🔧 API Endpoints

### Validate All Leads
```bash
POST /api/leads/validate
```
Validates all leads with status `SCRAPED`

**Response:**
```json
{
  "success": true,
  "validated": 50,
  "verified": 35,
  "invalid": 5,
  "message": "Validated 50 leads: 35 verified, 5 invalid"
}
```

### Validate Single Lead
```bash
GET /api/leads/validate?leadId=xxx
```
Validates a specific lead

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "status": "VERIFIED",
  "score": 85,
  "reasons": []
}
```

### Get Leads (with sorting)
```bash
GET /api/leads?status=VERIFIED&city=LAGOS&sortBy=name&sortOrder=asc
```

**Query Parameters:**
- `status`: Filter by status
- `city`: Filter by city
- `sortBy`: `createdAt` | `name` | `status` | `city` | `category`
- `sortOrder`: `asc` | `desc`

## 📝 Example Usage

### Scenario: Scrape Gyms in Lagos

1. Go to `/scrapers`
2. Select:
   - Type: Google Maps
   - Query: "gym Lagos"
   - City: LAGOS
   - Category: GYM
3. Click "Start Scraping"
4. Wait for job to complete
5. Go to `/leads`
6. Click "Auto-Validate All" (if not auto-validated)
7. Filter by `VERIFIED` status
8. Sort by `name` (alphabetical)
9. Review and message leads

## 🎨 UI Features

### Leads Page (`/leads`)

- **Auto-Validate Button**: Green button to validate all scraped leads
- **Filters**: Status and City dropdowns
- **Sort Controls**: Sort by field and order
- **Status Badges**: Color-coded status indicators
- **Real-time Updates**: Table refreshes automatically

### Status Colors

- `SCRAPED`: Gray
- `UNVERIFIED`: Orange
- `VERIFIED`: Blue
- `MESSAGED`: Purple
- `INTERESTED`: Green
- `CUSTOMER`: Dark Green
- `INVALID`: Red

## 🔍 Validation Details

### What Gets Validated

- ✅ Phone number format and validity
- ✅ Business name quality
- ✅ Address/area completeness
- ✅ Category specificity
- ✅ Source tracking
- ✅ Duplicate detection

### Validation Score Breakdown

| Criterion | Points | Penalty |
|-----------|--------|---------|
| Phone valid | 30 | -30 if invalid |
| Name valid | 20 | -20 if invalid |
| Address/Area | 15 | -15 if missing, -5 if partial |
| Category | 10 | -10 if OTHER |
| Source | 10 | -10 if missing |
| Duplicates | 15 | -15 if duplicate found |

**Total: 100 points**

## 🚨 Troubleshooting

### Leads Not Auto-Validating

- Check scraping job completed successfully
- Check browser console for errors
- Manually trigger validation via "Auto-Validate All" button

### Validation Too Strict/Loose

- Adjust validation thresholds in `lib/lead-validator.ts`
- Modify `validateLead()` function scoring

### Sorting Not Working

- Check API response in browser Network tab
- Verify sortBy and sortOrder parameters are being sent
- Check browser console for errors

## 📈 Next Steps

1. **Review Verified Leads**: Focus on `VERIFIED` status leads first
2. **Generate Messages**: Use message generator for outreach
3. **Track Progress**: Monitor conversion from VERIFIED → CUSTOMER
4. **Refine Validation**: Adjust rules based on results

## 💡 Tips

- **Start with Verified**: Always prioritize `VERIFIED` leads
- **Sort by Date**: Newest leads are often fresher
- **Filter by City**: Focus on one city at a time
- **Regular Validation**: Run validation after each scraping batch
- **Review Invalid**: Check `INVALID` leads occasionally - some might be false positives
