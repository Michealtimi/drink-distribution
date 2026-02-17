import { chromium, Browser } from 'playwright'
import { BaseScraper, ScrapedLead, ScraperConfig } from './base-scraper'
import { City, CustomerType } from '@prisma/client'
import { parsePhoneAndAddress } from '@/lib/parse-contact-block'

/**
 * Map search query to Finelib category path (city + category).
 * Finelib uses /cities/{city}/{category} e.g. /cities/lagos/health/fitness-and-gym
 */
function queryToFinelibPath(query: string, city: City): string[] {
  const q = query.toLowerCase().trim()
  const citySlug = city === City.ABUJA ? 'abuja' : 'lagos'
  const base = `/cities/${citySlug}`

  // Gyms and fitness
  if (/\b(gym|fitness|workout|exercise)\b/.test(q)) return [`${base}/health/fitness-and-gym`]
  // Events and venues
  if (/\b(event|venue|hall|center|centre)\b/.test(q)) return [`${base}/recreation`]
  // Clubs, bars, nightlife
  if (/\b(club|bar|nightclub)\b/.test(q)) return [`${base}/recreation`]
  // Lounges, restaurants, cafes
  if (/\b(lounge|restaurant|cafe|café)\b/.test(q)) return [`${base}/recreation`, `${base}/business`]
  // Offices and business
  if (/\b(office|corporate|business)\b/.test(q)) return [`${base}/business`]
  // Retail, shops, supermarket
  if (/\b(shop|store|retail|supermarket)\b/.test(q)) return [`${base}/shopping`]
  // Health (clinics, etc.)
  if (/\b(health|clinic|hospital)\b/.test(q)) return [`${base}/health`]
  // Sports
  if (/\b(sport)\b/.test(q)) return [`${base}/sports`]

  // Default: business + recreation to cover most FMCG targets
  return [`${base}/business`, `${base}/recreation`]
}

/**
 * Scraper for Finelib (finelib.com) - Nigerian business directory.
 * Uses real category URLs: /cities/lagos/health/fitness-and-gym etc.
 */
export class FinelibScraper extends BaseScraper {
  private browser: Browser | null = null

  constructor(config: ScraperConfig = {}) {
    super(config)
  }

  async scrape(query: string): Promise<ScrapedLead[]> {
    const results: ScrapedLead[] = []
    const city = this.config.city || City.LAGOS
    const paths = queryToFinelibPath(query, city)
    const baseUrl = 'https://www.finelib.com'

    try {
      console.log(`[FinelibScraper] Launching browser for query: "${query}" (city: ${city})`)
      this.browser = await chromium.launch({ headless: true })
      const page = await this.browser.newPage()

      for (const path of paths) {
        if (results.length >= (this.config.maxResults || 50)) break

        const url = `${baseUrl}${path}`
        console.log(`[FinelibScraper] Navigating to: ${url}`)
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
          await this.delay(3000)
        } catch (navError) {
          console.warn(`[FinelibScraper] Failed to load ${url}:`, navError)
          continue
        }

        const listings = await page.evaluate(() => {
          const out: Array<{ name: string; phone: string; address: string }> = []
          // Finelib listing links: /listing/Name/123/
          const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/listing/"]')
          const seen = new Set<string>()

          links.forEach((a) => {
            const href = a.getAttribute('href') || ''
            const match = href.match(/\/listing\/([^/]+)\/\d+/)
            const name = match ? decodeURIComponent(match[1].replace(/-/g, ' ')).trim() : (a.textContent || '').trim()
            if (!name || name.length < 2 || seen.has(name)) return
            seen.add(name)

            let address = ''
            let phone = ''
            // Next siblings after the link often contain address and phone
            let el: Element | null = a.parentElement
            if (el) {
              const text = el.textContent || ''
              // Nigerian phone pattern
              const phoneMatch = text.match(/(?:\+?234|0)[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/)
              if (phoneMatch) phone = phoneMatch[0].replace(/\s+/g, ' ').trim()
              // Address: look for "Road", "Street", "Lagos", "Abuja", "Ikeja", etc.
              const addrMatch = text.match(/([\dA-Za-z][^0-9+]*?(?:Road|Street|Avenue|Close|Lagos|Abuja|Ikeja|Victoria Island|Lekki|Wuse|Maitama)[^.]*)/)
              if (addrMatch) address = addrMatch[1].replace(/\s+/g, ' ').trim()
            }
            // If parent didn't have it, try next element
            if (!address || !phone) {
              let next: Element | null = el?.nextElementSibling ?? null
              for (let i = 0; i < 3 && next; i++) {
                const t = next.textContent || ''
                if (!phone && t.match(/(?:\+?234|0)[\s\-]?[0-9]{3}/)) {
                  const m = t.match(/(?:\+?234|0)[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/)
                  if (m) phone = m[0].replace(/\s+/g, ' ').trim()
                }
                if (!address && (t.includes('Lagos') || t.includes('Abuja') || t.includes('Road') || t.includes('Street')))
                  address = t.replace(/\s+/g, ' ').trim().slice(0, 200)
                next = next.nextElementSibling
              }
            }
            out.push({ name, phone, address })
          })
          return out.slice(0, 50)
        })

        const rawCount = listings.length
        console.log(`[FinelibScraper] Path ${path}: raw listings=${rawCount}`)

        for (const listing of listings) {
          if (results.length >= (this.config.maxResults || 50)) break

          const combined = [listing.address, listing.phone].filter(Boolean).join(' ')
          const { phone: parsedPhone, address: parsedAddress } = parsePhoneAndAddress(combined)
          const phone = parsedPhone ? this.normalizePhone(parsedPhone) : (listing.phone ? this.normalizePhone(listing.phone) : '')
          const address = parsedAddress || listing.address || undefined

          const lead: Partial<ScrapedLead> = {
            name: listing.name,
            phone,
            address: address || undefined,
            area: this.extractArea(address || listing.address),
            city,
            category: this.inferCategory(listing.name, address || listing.address),
          }

          if (this.validateLead(lead)) {
            results.push(lead as ScrapedLead)
          }
          await this.delay(200)
        }
        console.log(`[FinelibScraper] Path ${path}: valid leads so far=${results.length}`)

        await this.delay(2000)
      }

      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
      console.log(`[FinelibScraper] Total leads: ${results.length}`)
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
