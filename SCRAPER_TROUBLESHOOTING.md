# Scraper Troubleshooting Guide

## Issue: Scraper Returns No Leads

### Common Causes

1. **Playwright Browsers Not Installed** ⚠️
   - **Symptom**: Job completes but finds 0 leads
   - **Fix**: Install Playwright browsers
   ```powershell
   # Run PowerShell as Administrator, then:
   cd "c:\Users\mikolo\Desktop\Sales distribution"
   npx playwright install chromium
   ```

2. **Google Maps Selectors Changed**
   - **Symptom**: Scraper runs but finds 0 listings
   - **Fix**: The scraper now uses multiple selector strategies (already updated)
   - Check browser console logs for selector errors

3. **Network/Timeout Issues**
   - **Symptom**: Job fails or times out
   - **Fix**: Check internet connection, increase timeout in scraper config

4. **Validation Too Strict**
   - **Symptom**: Leads found but 0 imported
   - **Fix**: Check job errors - leads might be failing validation
   - View job details to see validation errors

## How to Debug

### 1. Check Job Status

Go to `/scrapers/[jobId]` to see:
- Job status (COMPLETED, FAILED, RUNNING)
- Number of leads found
- Number of leads imported
- Errors (if any)

### 2. Check Server Logs

Look in your terminal for:
- `[GoogleMapsScraper]` log messages
- `[ScraperManager]` log messages
- Error messages

### 3. Test Scraper Manually

The scraper now logs:
- When browser launches
- URL being scraped
- Number of listings found
- Number of valid leads
- Validation failures

## Recent Improvements

✅ **Multiple Selector Strategies**: Scraper tries different ways to find listings
✅ **Better Error Logging**: Detailed console logs at each step
✅ **Graceful Error Handling**: Returns empty array instead of crashing
✅ **Extended Timeouts**: More time for pages to load
✅ **Better Phone Extraction**: Multiple methods to find phone numbers

## Quick Fixes

### If Playwright Installation Fails:

1. **Run as Administrator**:
   - Right-click PowerShell
   - Select "Run as Administrator"
   - Navigate to project folder
   - Run: `npx playwright install chromium`

2. **Manual Installation**:
   - Download Chromium manually
   - Place in `node_modules/.playwright` folder

3. **Alternative**: Use a different scraper type (Directory or Instagram) that might not need Playwright

### If Selectors Don't Work:

Google Maps frequently changes their HTML structure. The scraper now:
- Tries multiple selector strategies
- Falls back to alternative methods
- Logs which strategy worked

Check the console logs to see which strategy is being used.

## Testing the Scraper

1. **Start a small test job**:
   - Query: "gym"
   - City: "Lagos"
   - Check job status

2. **Check the logs**:
   - Look for `[GoogleMapsScraper]` messages
   - See how many listings were found
   - See how many passed validation

3. **Check job details**:
   - Go to `/scrapers/[jobId]`
   - See errors if any
   - Check leadsFound vs leadsImported

## Expected Behavior

**Successful Scrape:**
```
[GoogleMapsScraper] Launching browser for query: "gym"
[GoogleMapsScraper] Navigating to: https://www.google.com/maps/search/...
[GoogleMapsScraper] Found 25 listings with strategy 1
[GoogleMapsScraper] Processing 25 listings
[GoogleMapsScraper] Valid lead: ABC Gym - 2348012345678
[GoogleMapsScraper] Total valid leads: 15
[ScraperManager] Scraped 15 leads
[ScraperManager] After deduplication: 12 unique, 3 duplicates
```

**Failed Scrape:**
```
[GoogleMapsScraper] Launching browser for query: "gym"
[GoogleMapsScraper] Navigating to: https://www.google.com/maps/search/...
[GoogleMapsScraper] Found 0 listings with strategy 1
[GoogleMapsScraper] Strategy 1 failed, trying alternative: [error]
[GoogleMapsScraper] Found 0 listings with strategy 2
[GoogleMapsScraper] Total valid leads: 0
```

## Next Steps

1. **Install Playwright** (if not installed)
2. **Run a test scrape** with a simple query
3. **Check the logs** to see what's happening
4. **View job details** to see any errors
5. **Report specific errors** if issues persist
