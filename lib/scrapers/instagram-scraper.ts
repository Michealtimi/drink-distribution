import { chromium, Browser, Page } from 'playwright'
import { BaseScraper, ScrapedLead, ScraperConfig } from './base-scraper'
import { City, CustomerType } from '@prisma/client'

export class InstagramScraper extends BaseScraper {
  private browser: Browser | null = null

  constructor(config: ScraperConfig = {}) {
    super(config)
  }

  async scrape(query: string): Promise<ScrapedLead[]> {
    const results: ScrapedLead[] = []

    try {
      this.browser = await chromium.launch({ headless: true })
      const page = await this.browser.newPage()

      // Build Instagram search URL
      const searchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/\s+/g, ''))}/`

      await page.goto(searchUrl, { waitUntil: 'networkidle' })
      await this.delay(3000)

      // Note: Instagram requires login for full access
      // This is a basic implementation that works with public profiles
      // For business pages, we'd need to search differently

      // Alternative: Search for business accounts directly
      const businessSearchUrl = `https://www.instagram.com/${encodeURIComponent(query)}/`

      try {
        await page.goto(businessSearchUrl, { waitUntil: 'networkidle', timeout: 10000 })
        await this.delay(2000)

        // Extract business info from profile
        const businessInfo = await page.evaluate(() => {
          const nameEl = document.querySelector('h2')
          const name = nameEl?.textContent?.trim() || ''

          // Try to find contact info in bio
          const bioEl = document.querySelector('div[data-testid="user-bio"]')
          const bio = bioEl?.textContent || ''

          // Extract phone from bio (common pattern)
          const phoneMatch = bio.match(/(\+?234|0)?[\s-]?[0-9]{3}[\s-]?[0-9]{3}[\s-]?[0-9]{4}/)
          const phone = phoneMatch ? phoneMatch[0] : ''

          // Extract address/area from bio
          const addressMatch = bio.match(/(Lagos|Abuja|Victoria Island|Lekki|Ikeja|Wuse|Maitama)[^,]*/i)
          const address = addressMatch ? addressMatch[0] : ''

          return { name, phone, address, bio }
        })

        if (businessInfo.name) {
          const lead: Partial<ScrapedLead> = {
            name: businessInfo.name,
            phone: businessInfo.phone ? this.normalizePhone(businessInfo.phone) : '',
            address: businessInfo.address || undefined,
            area: this.extractArea(businessInfo.address || businessInfo.bio),
            city: this.config.city || City.LAGOS,
            category: this.inferCategory(businessInfo.name, businessInfo.bio),
          }

          if (this.validateLead(lead)) {
            results.push(lead as ScrapedLead)
          }
        }

      } catch (error) {
        // Profile might not exist or be private
        this.handleError(error, 'scrape profile')
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
