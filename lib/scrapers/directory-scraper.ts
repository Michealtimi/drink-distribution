import { chromium, Browser } from 'playwright'
import { BaseScraper, ScrapedLead, ScraperConfig } from './base-scraper'
import { City } from '@prisma/client'
import { parsePhoneAndAddress } from '@/lib/parse-contact-block'

/**
 * Generic directory scraper. Uses Finelib city/category URLs for reliable results.
 * Same targets as sales distribution: gyms, events, clubs, lounges, offices, retailers.
 */
export class DirectoryScraper extends BaseScraper {
  private browser: Browser | null = null

  constructor(config: ScraperConfig = {}) {
    super(config)
  }

  async scrape(query: string): Promise<ScrapedLead[]> {
    const results: ScrapedLead[] = []
    const city = this.config.city || City.LAGOS
    const citySlug = city === City.ABUJA ? 'abuja' : 'lagos'
    const baseUrl = 'https://www.finelib.com'
    const q = query.toLowerCase().trim()

    // Map query to Finelib category paths (same logic as Finelib scraper for consistency)
    let paths: string[] = []
    if (/\b(gym|fitness|workout|exercise)\b/.test(q)) paths = [`/cities/${citySlug}/health/fitness-and-gym`]
    else if (/\b(event|venue|hall|center|centre)\b/.test(q)) paths = [`/cities/${citySlug}/recreation`]
    else if (/\b(club|bar|nightclub|lounge|restaurant|cafe)\b/.test(q)) paths = [`/cities/${citySlug}/recreation`]
    else if (/\b(office|corporate|business)\b/.test(q)) paths = [`/cities/${citySlug}/business`]
    else if (/\b(shop|store|retail|supermarket)\b/.test(q)) paths = [`/cities/${citySlug}/shopping`]
    else paths = [`/cities/${citySlug}/business`, `/cities/${citySlug}/recreation`]

    try {
      console.log(`[DirectoryScraper] Launching for query: "${query}" (city: ${city})`)
      this.browser = await chromium.launch({ headless: true })
      const page = await this.browser.newPage()

      for (const path of paths) {
        if (results.length >= (this.config.maxResults || 50)) break
        const url = `${baseUrl}${path}`
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
          await this.delay(3000)
        } catch {
          continue
        }

        const listings = await page.evaluate(() => {
          const out: Array<{ name: string; phone: string; address: string }> = []
          document.querySelectorAll<HTMLAnchorElement>('a[href*="/listing/"]').forEach((a) => {
            const href = a.getAttribute('href') || ''
            const match = href.match(/\/listing\/([^/]+)\/\d+/)
            const name = match ? decodeURIComponent(match[1].replace(/-/g, ' ')).trim() : (a.textContent || '').trim()
            if (!name || name.length < 2) return
            let parent: Element | null = a.parentElement
            let phone = ''
            let address = ''
            for (let i = 0; i < 4 && parent; i++) {
              const t = parent.textContent || ''
              const pm = t.match(/(?:\+?234|0)[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/)
              if (pm) phone = pm[0].replace(/\s+/g, ' ').trim()
              if ((t.includes('Lagos') || t.includes('Abuja') || t.includes('Road') || t.includes('Street')) && !address)
                address = t.replace(/\s+/g, ' ').trim().slice(0, 200)
              parent = parent.nextElementSibling
            }
            out.push({ name, phone, address })
          })
          return out.slice(0, 50)
        })

        for (const listing of listings) {
          if (results.length >= (this.config.maxResults || 50)) break
          const lead: Partial<ScrapedLead> = {
            name: listing.name,
            phone: listing.phone ? this.normalizePhone(listing.phone) : '',
            address: listing.address || undefined,
            area: this.extractArea(listing.address),
            city,
            category: this.inferCategory(listing.name, listing.address),
          }
          if (this.validateLead(lead)) results.push(lead as ScrapedLead)
          await this.delay(200)
        }
        await this.delay(2000)
      }

      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
      console.log(`[DirectoryScraper] Total valid leads: ${results.length}`)
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
