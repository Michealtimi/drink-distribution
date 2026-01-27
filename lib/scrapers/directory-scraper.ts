import { chromium, Browser, Page } from 'playwright'
import { BaseScraper, ScrapedLead, ScraperConfig } from './base-scraper'
import { City, CustomerType } from '@prisma/client'

/**
 * Generic directory scraper for Nigerian business directories
 * Can be configured for different directory sites
 */
export class DirectoryScraper extends BaseScraper {
  private browser: Browser | null = null
  private directoryUrl: string

  constructor(config: ScraperConfig & { directoryUrl?: string } = {}) {
    super(config)
    // Default to a common Nigerian business directory
    // Can be overridden for different directories
    this.directoryUrl = config.directoryUrl || 'https://www.nigerianbusinessdirectory.com'
  }

  async scrape(query: string): Promise<ScrapedLead[]> {
    const results: ScrapedLead[] = []

    try {
      this.browser = await chromium.launch({ headless: true })
      const page = await this.browser.newPage()

      // Build search URL (format depends on directory)
      const searchUrl = `${this.directoryUrl}/search?q=${encodeURIComponent(query)}`

      await page.goto(searchUrl, { waitUntil: 'networkidle' })
      await this.delay(3000)

      // Extract listings (generic selector - may need adjustment per directory)
      const listings = await page.$$eval('.listing, .business-card, .result-item', (items) => {
        return items.slice(0, 20).map((item) => {
          const nameEl = item.querySelector('h3, .name, .title, [class*="name"]')
          const name = nameEl?.textContent?.trim() || ''

          const phoneEl = item.querySelector('[class*="phone"], [class*="contact"], .tel')
          const phone = phoneEl?.textContent?.trim() || ''

          const addressEl = item.querySelector('[class*="address"], [class*="location"], .address')
          const address = addressEl?.textContent?.trim() || ''

          return { name, phone, address }
        }).filter(item => item.name)
      })

      // Process listings
      for (const listing of listings) {
        if (results.length >= (this.config.maxResults || 50)) break

        const lead: Partial<ScrapedLead> = {
          name: listing.name,
          phone: listing.phone ? this.normalizePhone(listing.phone) : '',
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
