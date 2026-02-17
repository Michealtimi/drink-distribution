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

3. **Target site unreachable (ERR_NAME_NOT_RESOLVED)**
   - **Symptom**: Each query completes with 0 leads; terminal shows `page.goto: net::ERR_NAME_NOT_RESOLVED`
   - **Cause**: The scraped site may be down, blocked, or the domain changed. (BusinessList Nigeria was removed because businesslist.ng does not resolve.)
   - **Fix**: Try another scraper type (e.g. Google Maps, Finelib). Check your network/DNS. The job still completes; results show on the platform from the in-memory store.

4. **Terminal flooded with "Unknown argument \`scrapedResults\`"**
   - **Symptom**: Hundreds of Prisma errors in terminal; job runs and UI may still show live results
   - **Fix**: Run `pnpm db:push` then `pnpm prisma generate`, then restart the dev server (see SETUP.md)

5. **Network/Timeout Issues**
   - **Symptom**: Job fails or times out
   - **Fix**: Check internet connection, increase timeout in scraper config

6. **Validation Too Strict**
   - **Symptom**: Leads found but 0 imported
   - **Fix**: Check job errors - leads might be failing validation
   - View job details to see validation errors

---

## Why do I see results in the terminal but “Failed” or “No result” on the platform?

### What’s going on

1. **Terminal**  
   The scraper runs inside your Node/Next.js process. It logs there (e.g. “Query X completed: N leads found”, “After import: X imported”). So you see **live logs** in the terminal.

2. **Platform (browser)**  
   The UI gets data in two ways:
   - **“Leads found” table** → from an **in-memory store** in the same Node process (or from the DB if you’ve run `db:push` + `prisma generate`).
   - **Job status** (e.g. COMPLETED / FAILED) and **imported leads** → from the **database**.

So you can have:
- Terminal: “50 leads found”, “10 imported”
- Platform: **Failed** and **no result**

### Typical causes

| Cause | What happens | What to do |
|-------|----------------|------------|
| **Job throws after scraping** | Scraper finds leads and logs them. Then something fails (e.g. import, DB timeout). Job is marked **FAILED**. The “Leads found” list in the UI comes from in-memory store; if you opened the page **after** the server restarted, that store is empty. | Fix the error (see job Errors section). Run `pnpm db:push` and `pnpm prisma generate` so scraped results are saved to the DB and survive restarts. |
| **Server restarted** | In-memory store is cleared on restart. Terminal still shows the old run’s logs; the UI is talking to a new process with an empty store, so “Leads found” is 0. | Run `pnpm db:push` and `pnpm prisma generate`. Then future jobs will persist “Leads found” to the DB and the UI can show them even after a restart. |
| **Different process / serverless** | On some hosts, the request that runs the job and the request that serves the job page can be different instances. The instance that ran the job has the results in memory; the one serving the page might not. | Run `pnpm db:push` and `pnpm prisma generate` so results are stored in the DB and any instance can read them. |

### Summary

- **Terminal** = logs from the process that ran the scraper.
- **Platform** = in-memory store (same process) or DB. If the process restarts or is different, in-memory is empty.
- **Fix:** Run `pnpm db:push` and `pnpm prisma generate`, then restart the dev server. After that, scraped results are saved to the DB and the “Leads found” section can show them even after a restart or on another instance.

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
