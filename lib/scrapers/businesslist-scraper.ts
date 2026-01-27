import { chromium, Browser } from 'playwright'
import { BaseScraper, ScrapedLead, ScraperConfig } from './base-scraper'
import { City, CustomerType } from '@prisma/client'

/**
 * Scraper for BusinessList Nigeria (businesslist.ng)
 */
export class BusinessListScraper extends BaseScraper {
  private browser: Browser | null = null

  constructor(config: ScraperConfig = {}) {
    super(config)
  }

  async scrape(query: string): Promise<ScrapedLead[]> {
    const results: ScrapedLead[] = []

    try {
      console.log(`[BusinessListScraper] Launching browser for query: "${query}"`)
      this.browser = await chromium.launch({ headless: true })
      const page = await this.browser.newPage()

      // Build search URL
      const cityName = this.config.city === City.ABUJA ? 'abuja' : 'lagos'
      const searchUrl = `https://www.businesslist.ng/search?q=${encodeURIComponent(query)}&location=${cityName}`

      console.log(`[BusinessListScraper] Navigating to: ${searchUrl}`)
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.delay(3000)

      // Extract listings
      const listings = await page.evaluate(() => {
        const results: Array<{ name: string; phone: string; address: string }> = []
        const cards = document.querySelectorAll('.business-card, .listing-item, .result-item')

        cards.forEach((card) => {
          const nameEl = card.querySelector('h3, .business-name, .title, [class*="name"]')
          const name = nameEl?.textContent?.trim() || ''

          const phoneEl = card.querySelector('.phone, [class*="phone"], [class*="contact"]')
          const phone = phoneEl?.textContent?.trim() || ''

          const addressEl = card.querySelector('.address, [class*="address"], [class*="location"]')
          const address = addressEl?.textContent?.trim() || ''

          if (name && name.length > 2) {
            results.push({ name, phone, address })
          }
        })

        return results.slice(0, 50)
      })

      console.log(`[BusinessListScraper] Found ${listings.length} listings`)

      // Process listings
      for (const listing of listings) {
        if (results.length >= (this.config.maxResults || 50)) break

        const lead: Partial<ScrapedLead> = {
          name: listing.name,
          phone: listing.phone ? this.normalizePhone(listing.phone) : '2340000000000',
          address: listing.address || undefined,
          area: this.extractArea(listing.address),
          city: this.config.city || City.LAGOS,
          category: this.inferCategory(listing.name, listing.address),
        }

        if (this.validateLead(lead)) {
          results.push(lead as ScrapedLead)
        }

        await this.delay()
      }

      await this.browser.close()
      this.browser = null

    } catch (error) {
      this.handleError(error, 'scrape')
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
    }

    return results
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}
