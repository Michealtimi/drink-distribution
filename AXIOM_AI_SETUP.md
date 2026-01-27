# Axiom.ai Integration Setup Guide

This guide walks you through setting up Axiom.ai browser automation to scrape leads and send them to our CRM system.

## Overview

Axiom.ai is a Chrome extension that allows you to create browser automation bots without coding. Instead of running Playwright scrapers on the server, Axiom.ai bots run in your browser and send scraped data to our API endpoint.

## Benefits

- **Visual Debugging**: See the bot running in real-time
- **No Code Required**: Create bots using a visual interface
- **Better Data Extraction**: Can extract phone/email more reliably from dynamic pages
- **Flexible**: Easy to adapt when websites change
- **Free Tier**: 2 hours runtime/month (good for testing)

## 🎯 Where to Target (Strategic Focus)

Think in 3 layers:

1. **Where the right customers already list themselves**
2. **Where contact details are visible without APIs**
3. **Where scraping won't get you blocked quickly**

You are NOT trying to scrape "everything". You are building a focused lead engine.

### 1️⃣ PRIMARY TARGETS (HIGH-CONVERSION, LOW NOISE)

These should be your first 80% effort.

#### A. Google Maps (WEB ONLY, NOT API)

✅ Best source for real businesses  
✅ Works well with Axiom browser automation

**What to search (exact phrases):**
- `gym in Lagos`
- `fitness center in Lagos`
- `event center in Lagos`
- `club in Lagos`
- `lounge in Lagos`
- `bar in Lagos`
- `gym in Abuja`
- `event center in Abuja`
- `club in Abuja`

**What you extract:**
- Business name
- Category
- Area
- Phone number
- Website (if any)

**👉 Why this is gold:**
- These businesses already buy drinks
- Phones are usually WhatsApp numbers
- High trial acceptance rate

**⚠️ Rule:**
- Do NOT scroll endlessly
- Scrape 20–30 per session
- Change search areas (Ikeja, Lekki, Wuse, Garki, etc.)

#### B. Instagram Business Pages (VERY IMPORTANT)

Axiom works well here because it's browser-based.

**What to search on Instagram:**
- `@lagosgym`
- `@abujaeventcenter`
- `@lagosclub`
- `@abuja_lounge`
- `@fitnesslagos`

**What you extract:**
- Page name
- Bio phone number / WhatsApp link
- Business type
- Location (from bio)

**👉 Why this works:**
- Many gyms & clubs respond faster on WhatsApp
- Event planners live on Instagram
- They already sell drinks or host events

**⚠️ Rule:**
- Do NOT DM with bots
- Only scrape → message manually

### 2️⃣ SECONDARY TARGETS (GOOD, BUT FILTER HARD)

Use these once your primary pipeline is running.

#### A. Nigerian Business Directories

**Examples:**
- VConnect
- BusinessList.ng
- Finelib

**Target categories:**
- Event centers
- Nightclubs
- Gyms
- Bars

**Extract:**
- Business name
- Phone
- Address

**⚠️ These have more:**
- Dead numbers
- Old listings

So always mark leads as Unverified first.

#### B. Event Planners & Vendors

**Search:**
- "event planner Lagos"
- "event services Abuja"

**Why?**
- They influence drink decisions for events
- Good for cognac + Red Bull combos

### 3️⃣ SUPPLIER TARGETING (DO NOT SCRAPE RANDOMLY)

Suppliers are fewer — be surgical.

**Target:**
- Beverage wholesalers
- Alcohol distributors
- FMCG depots

**Where to find them:**
- Google Maps: "beverage wholesaler Lagos"
- "alcohol distributor Abuja"
- Instagram: "drink supplier Lagos"

**Extract:**
- Company name
- Phone
- Location
- Products listed

You only need 1–2 solid suppliers.

### ❌ WHAT YOU SHOULD NOT TARGET

- Random consumers
- Online forums
- Telegram groups
- Email-only lists
- Websites without phone numbers

**Your system is WhatsApp-first, not email-first.**

### 📊 YOUR LEAD PRIORITY ORDER (VERY IMPORTANT)

Always message in this order:

1. **Gyms** - Faster trials, smaller objections, faster reorders
2. **Event centers** - High volume potential
3. **Clubs & lounges** - Regular reorders
4. **Offices** - Steady demand
5. **Small shops** - Lower priority

## Step 1: Install Axiom.ai Extension

1. Open Chrome Web Store
2. Search for "Axiom.ai"
3. Click "Add to Chrome"
4. Pin the extension to your toolbar
5. Create a free account (if prompted)

## Step 2: Create Your First Scraping Bot

### 2.1 Open Axiom.ai

1. Click the Axiom.ai icon in your Chrome toolbar
2. Sign in to your account
3. Click "Create New Bot"

### 2.2 Name Your Bot

- **Name**: "Google Maps Lead Scraper - Lagos Gyms"
- **Description**: "Scrapes gym leads from Google Maps in Lagos"

## Step 3: Configure Bot Steps

### Step 1: Navigate to Google Maps

1. Add step: **"Navigate"**
2. **URL**: `https://www.google.com/maps/search/gym+Lagos+Nigeria`
   - Replace "gym" with your search term
   - Replace "Lagos" with your target city

### Step 2: Wait for Page Load

1. Add step: **"Wait"**
2. **Duration**: 5 seconds
3. This ensures the page fully loads before scraping

### Step 3: Extract Business Cards

1. Add step: **"Extract Data"**
2. **Selector**: Use Axiom.ai's selector tool to click on a business card
3. **Extract Fields**:
   - `name`: Business name
   - `address`: Full address
4. **Repeat**: Select "Extract all matching elements"

### Step 4: Loop Through Each Business

1. Add step: **"Loop"**
2. **Loop Over**: The extracted business cards from Step 3
3. **Inside Loop**:
   - **Click**: Click on the business card to open details
   - **Wait**: Wait 2 seconds for details to load
   - **Extract**:
     - `phone`: Phone number (if available)
     - `email`: Email address (if available)
   - **Add to Array**: Store the data in an array variable

### Step 5: Send Data to API

1. Add step: **"HTTP Request"**
2. **Method**: POST
3. **URL**: 
   - **Local Development**: `http://localhost:3000/api/leads/axiom`
   - **Production**: `https://your-domain.com/api/leads/axiom`
4. **Headers**:
   ```
   Content-Type: application/json
   ```
   (Optional: Add `Authorization: Bearer YOUR_API_KEY` if you set up API key authentication)
5. **Body** (JSON):
   ```json
   {
     "leads": [
       {
         "name": "{{loop_item.name}}",
         "phone": "{{loop_item.phone}}",
         "email": "{{loop_item.email}}",
         "address": "{{loop_item.address}}",
         "city": "LAGOS",
         "category": "GYM",
         "source": "Axiom.ai - Google Maps"
       }
     ],
     "source": "Axiom.ai - Google Maps"
   }
   ```
   - Replace `{{loop_item.name}}` with the variable from your loop
   - Adjust `city` to match your target (LAGOS or ABUJA)
   - Adjust `category` to match your search (GYM, EVENT_CENTER, CLUB, LOUNGE, OFFICE, SMALL_RETAILER, OTHER)

### Step 6: Handle Multiple Pages (Optional)

If you want to scrape multiple pages:

1. After Step 5, add step: **"Click"**
2. **Selector**: The "Next" button on Google Maps
3. **Wait**: 3 seconds
4. **Go to Step 3**: Loop back to extract more businesses

## Step 4: Test Your Bot

1. Click "Run Bot" in Axiom.ai
2. Watch it execute step by step
3. Check the API response in the HTTP Request step
4. Verify leads appear in your CRM at `/leads`

## Step 5: Create Bots for Other Sources

### BusinessList Nigeria Bot

1. **Navigate**: `https://businesslist.com.ng/search?q=gym&location=Lagos`
2. **Extract**: Name, Address, Phone, Email
3. **Send to API**: Same endpoint, adjust `source` to "Axiom.ai - BusinessList"

### Finelib Bot

1. **Navigate**: `https://www.finelib.com/search?q=gym&location=Lagos`
2. **Extract**: Name, Address, Phone, Email
3. **Send to API**: Same endpoint, adjust `source` to "Axiom.ai - Finelib"

## API Endpoint Details

### POST /api/leads/axiom

**Request Format**:
```json
{
  "leads": [
    {
      "name": "Fitness Center Lagos",
      "phone": "2348012345678",
      "email": "info@fitness.com",
      "address": "123 Victoria Island, Lagos",
      "city": "LAGOS",
      "category": "GYM",
      "source": "Axiom.ai - Google Maps"
    }
  ],
  "source": "Axiom.ai - Google Maps"
}
```

**Validation Rules**:
- `name`: Required
- `phone`: Optional, but must be valid Nigerian format if provided
- `email`: Optional, but must be valid email format if provided
- `city`: Required, must be "LAGOS" or "ABUJA"
- `category`: Required, must be valid CustomerType
- **At least one of `phone` or `email` must be provided**

**Response (Success)**:
```json
{
  "success": true,
  "imported": 10,
  "duplicates": 2,
  "errors": 0,
  "message": "Leads imported successfully"
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Lead 0: Missing required field 'name'",
    "Lead 1: Invalid email format"
  ]
}
```

## Tips for Better Scraping

1. **Start Small**: Test with 5-10 businesses first
2. **Add Delays**: Use "Wait" steps between actions to avoid being blocked
3. **Handle Errors**: Add error handling steps in Axiom.ai
4. **Check Selectors**: If a site changes, update your selectors
5. **Respect Rate Limits**: Don't scrape too aggressively

## Troubleshooting

### Bot Not Finding Elements

- Use Axiom.ai's selector tool to update selectors
- Add longer wait times
- Check if the page structure changed

### API Returns 400 Error

- Check that at least one of phone or email is provided
- Verify city is "LAGOS" or "ABUJA" (uppercase)
- Verify category matches valid CustomerType values

### API Returns 401 Error

- Check if API key authentication is enabled
- Verify the Authorization header is correct

### Leads Not Appearing in CRM

- Check the API response for errors
- Verify the database connection
- Check browser console for errors

## Next Steps

1. Create bots for all your target sources
2. Schedule regular runs (if Axiom.ai supports scheduling)
3. Monitor imported leads in the CRM
4. Adjust bot configurations as needed

## Support

For issues with:
- **Axiom.ai**: Check Axiom.ai documentation
- **API Endpoint**: Check server logs and API response
- **CRM Integration**: Verify database connection and schema
