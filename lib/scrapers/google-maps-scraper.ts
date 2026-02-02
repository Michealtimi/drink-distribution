import { chromium, Browser, Page } from 'playwright'
import { BaseScraper, ScrapedLead, ScraperConfig } from './base-scraper'
import { City, CustomerType } from '@prisma/client'

export class GoogleMapsScraper extends BaseScraper {
  private browser: Browser | null = null

  constructor(config: ScraperConfig = {}) {
    super(config)
  }

  async scrape(query: string): Promise<ScrapedLead[]> {
    const results: ScrapedLead[] = []
    
    try {
      console.log(`[GoogleMapsScraper] Launching browser for query: "${query}"`)
      // Launch browser
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      const page = await this.browser.newPage()

      // Build search query with location
      const cityName = this.config.city === City.ABUJA ? 'Abuja' : 'Lagos'
      const searchQuery = `${query} ${cityName} Nigeria`
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`
      
      console.log(`[GoogleMapsScraper] Navigating to: ${mapsUrl}`)
      // Use 'domcontentloaded' instead of 'networkidle' - Google Maps has continuous network activity
      try {
        await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
        await this.delay(8000) // Wait for maps to fully load
      } catch (timeoutError) {
        console.warn(`[GoogleMapsScraper] Initial load timeout, trying with 'load' strategy...`)
        await page.goto(mapsUrl, { waitUntil: 'load', timeout: 60000 })
        await this.delay(8000)
      }

      // Scroll to load more results
      await this.scrollToLoadMore(page)

      // Extract listings from Google Maps search results
      let listings: Array<{ name: string; phone: string; address: string; link?: string }> = []
      
      try {
        // Strategy 1: Extract from search results cards
        listings = await page.evaluate(() => {
          const results: Array<{ name: string; phone: string; address: string; link?: string }> = []
          
          // Find all result cards/articles
          const cards = document.querySelectorAll('div[role="article"], a[href*="/maps/place/"]')
          
          cards.forEach((card) => {
            // Get name
            const nameEl = card.querySelector('div[role="heading"], h3, [class*="fontHeadline"], [class*="title"]')
            const name = nameEl?.textContent?.trim() || ''
            
            if (!name || name.length < 2) return
            
            // Get address
            let address = ''
            const addressEl = card.querySelector('span[aria-label*="Address"], [class*="address"], [class*="location"]')
            if (addressEl) {
              address = addressEl.textContent?.trim() || addressEl.getAttribute('aria-label') || ''
            }
            
            // Get link to place details (for getting phone later)
            let link = ''
            if (card.tagName === 'A') {
              link = (card as HTMLAnchorElement).href
            } else {
              const linkEl = card.querySelector('a[href*="/maps/place/"]')
              if (linkEl) {
                link = (linkEl as HTMLAnchorElement).href
              }
            }
            
            results.push({ name, phone: '', address, link })
          })
          
          return results.slice(0, 20) // Limit to 20 for performance
        })
        
        console.log(`[GoogleMapsScraper] Found ${listings.length} listings from search results`)
        
        // Strategy 2: Try to get phone numbers by clicking into places (limited to first 5 for performance)
        if (listings.length > 0) {
          console.log(`[GoogleMapsScraper] Attempting to get phone numbers for first 5 places...`)
          for (let i = 0; i < Math.min(5, listings.length); i++) {
            const listing = listings[i]
            if (listing.link) {
              try {
                // Open place details in new tab
                const detailPage = await this.browser!.newPage()
                await detailPage.goto(listing.link, { waitUntil: 'networkidle', timeout: 15000 })
                await this.delay(2000)
                
                // Try to find phone number
                const phone = await detailPage.evaluate(() => {
                  // Multiple strategies to find phone
                  const phoneButton = document.querySelector('button[data-item-id*="phone"], button[aria-label*="Phone"]')
                  if (phoneButton) {
                    const phoneText = phoneButton.getAttribute('aria-label') || phoneButton.textContent || ''
                    const phoneMatch = phoneText.match(/(\+?234|0)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/)
                    if (phoneMatch) return phoneMatch[0]
                  }
                  
                  // Try finding phone in contact section
                  const contactSection = document.querySelector('[data-section-id="contact"]')
                  if (contactSection) {
                    const phoneText = contactSection.textContent || ''
                    const phoneMatch = phoneText.match(/(\+?234|0)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/)
                    if (phoneMatch) return phoneMatch[0]
                  }
                  
                  return ''
                })
                
                if (phone) {
                  listing.phone = phone
                  console.log(`[GoogleMapsScraper] Found phone for ${listing.name}: ${phone}`)
                }
                
                await detailPage.close()
                await this.delay(1000) // Rate limiting
              } catch (error) {
                console.warn(`[GoogleMapsScraper] Failed to get phone for ${listing.name}:`, error)
              }
            }
          }
        }
      } catch (error) {
        console.error(`[GoogleMapsScraper] Error extracting listings:`, error)
      }

      // Process listings
      console.log(`[GoogleMapsScraper] Processing ${listings.length} listings`)
      let validCount = 0
      let invalidCount = 0
      
      for (const listing of listings) {
        if (results.length >= (this.config.maxResults || 50)) break

        const normalizedPhone = listing.phone && listing.phone.trim().length > 0
          ? this.normalizePhone(listing.phone)
          : ''
        const lead: Partial<ScrapedLead> = {
          name: listing.name,
          phone: normalizedPhone,
          address: listing.address || undefined,
          area: this.extractArea(listing.address),
          city: this.config.city || City.LAGOS,
          category: this.inferCategory(listing.name, listing.address),
        }

        if (this.validateLead(lead)) {
          results.push(lead as ScrapedLead)
          validCount++
          const phoneStatus = !normalizedPhone ? 'NEEDS_PHONE' : 'HAS_PHONE'
          console.log(`[GoogleMapsScraper] ✓ Valid lead: ${lead.name} - ${phoneStatus}`)
        } else {
          invalidCount++
          console.log(`[GoogleMapsScraper] ✗ Invalid lead: ${lead.name} (validation failed)`)
        }

        await this.delay(500) // Shorter delay between processing
      }
      
      console.log(`[GoogleMapsScraper] Summary: ${validCount} valid, ${invalidCount} invalid out of ${listings.length} listings`)
      
      console.log(`[GoogleMapsScraper] Total valid leads: ${results.length}`)

      await this.browser.close()
      this.browser = null

    } catch (error) {
      const errorMsg = this.handleError(error, 'scrape')
      console.error(`[GoogleMapsScraper] Scraping failed:`, errorMsg)
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
      // Return empty array on error instead of throwing
      return []
    }

    return results
  }

  private async scrollToLoadMore(page: Page): Promise<void> {
    // Scroll down to load more results
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const scrollable = document.querySelector('div[role="main"]')
        if (scrollable) {
          scrollable.scrollTop = scrollable.scrollHeight
        }
      })
      await this.delay(2000)
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}
