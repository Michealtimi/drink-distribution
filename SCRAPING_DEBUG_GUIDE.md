# Scraping Debug Guide

## How Scraping Works

### 1. **Google Maps Scraper** (Primary Method)

The scraper works in these steps:

1. **Launch Browser**: Opens a headless Chromium browser
2. **Search Google Maps**: Navigates to `https://www.google.com/maps/search/{query} {city} Nigeria`
3. **Extract Listings**: Finds all business listings from search results
4. **Get Phone Numbers**: For the first 5 listings, opens each place's detail page to extract phone numbers
5. **Validate & Import**: Validates each lead and imports to database

### 2. **Why Leads Might Not Be Scraped**

#### Common Issues:

1. **No Phone Numbers Found**
   - Google Maps doesn't show phone numbers in search results
   - The scraper tries to get phones by opening detail pages (first 5 only for performance)
   - Leads without phones get a placeholder: `2340000000000`
   - These leads are still imported but need phone numbers added manually

2. **Playwright Not Installed**
   - Run: `npx playwright install chromium`
   - Check terminal for errors about missing browsers

3. **Google Maps Structure Changed**
   - Google frequently updates their HTML structure
   - Check server logs for selector errors
   - The scraper uses multiple fallback strategies

4. **Network/Timeout Issues**
   - Check internet connection
   - Google Maps might be blocking automated requests
   - Try running scraper again

### 3. **How to Debug**

#### Check Server Logs

Look in your terminal/console for these messages:

```
[GoogleMapsScraper] Launching browser for query: "gym"
[GoogleMapsScraper] Navigating to: https://www.google.com/maps/search/...
[GoogleMapsScraper] Found X listings from search results
[GoogleMapsScraper] Attempting to get phone numbers for first 5 places...
[GoogleMapsScraper] Found phone for [Business Name]: [Phone]
[GoogleMapsScraper] Summary: X valid, Y invalid out of Z listings
[ScraperManager] Total scraped X leads from Y queries
```

#### Check Job Status

1. Go to `/scrapers` page
2. Click "View" on a completed job
3. Check:
   - **Leads Found**: Total listings discovered
   - **Leads Imported**: Successfully saved to database
   - **Duplicates**: Already existed in database
   - **Errors**: Any issues encountered

#### Common Error Messages

- `"Found 0 listings"` → Google Maps selectors might have changed
- `"Skipping [name] - no phone number found"` → Phone extraction failed (lead still imported with placeholder)
- `"Invalid lead"` → Failed validation (missing name, city, or category)
- `"Failed to start scraping job"` → Check Playwright installation or database connection

### 4. **Improving Results**

#### For Better Phone Number Extraction:

The scraper currently only gets phones for the first 5 places (for performance). To get more:

1. Increase the limit in `google-maps-scraper.ts` line 83:
   ```typescript
   for (let i = 0; i < Math.min(10, listings.length); i++) { // Changed from 5 to 10
   ```

2. **Note**: This will make scraping slower but get more complete data

#### For More Listings:

1. The scraper scrolls 3 times to load more results
2. Increase scrolls in `scrollToLoadMore()` method
3. Increase `maxResults` in scraper config

### 5. **Manual Phone Addition**

If leads are imported without phones (placeholder `2340000000000`):

1. Go to `/leads` page
2. Filter by status: "Scraped"
3. Click on a lead
4. Edit and add the phone number manually
5. Or use the "View Scraped Leads" button to see all scraped leads

### 6. **Testing the Scraper**

To test if scraping works:

1. Start a scraping job with a simple query like "gym Lagos"
2. Watch the terminal for log messages
3. Check the job status page after completion
4. If 0 leads found, check:
   - Playwright is installed
   - Internet connection works
   - Google Maps is accessible
   - Check browser console for errors (if running in non-headless mode)

### 7. **Alternative: Manual Lead Entry**

If scraping isn't working, you can:

1. Manually search Google Maps
2. Copy business information
3. Go to `/leads/new`
4. Add leads manually

This is more reliable but slower.

## Current Limitations

- **Phone Numbers**: Only extracted for first 5 places (performance trade-off)
- **Rate Limiting**: Delays between requests to avoid being blocked
- **Google Maps Changes**: Selectors may need updates if Google changes their structure
- **Instagram Scraper**: Limited functionality (requires login for full access)
- **Directory Scraper**: Generic implementation (may need customization per directory)

## Next Steps

If scraping still doesn't work:

1. Check the job details page for specific errors
2. Review server logs for detailed error messages
3. Try a different query (e.g., "fitness center Lagos")
4. Verify Playwright installation: `npx playwright install chromium`
5. Check database connection and Prisma client setup
