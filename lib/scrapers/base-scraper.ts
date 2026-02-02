import { City, CustomerType } from '@prisma/client'

export interface ScrapedLead {
  name: string
  phone: string
  address?: string
  area?: string
  city: City
  category: CustomerType
}

export interface ScraperConfig {
  city?: City
  category?: CustomerType
  maxResults?: number
  delayBetweenRequests?: number // milliseconds
}

export abstract class BaseScraper {
  protected config: ScraperConfig
  protected delayBetweenRequests: number

  constructor(config: ScraperConfig = {}) {
    this.config = {
      maxResults: 50,
      delayBetweenRequests: 2000, // 2 seconds default
      ...config,
    }
    this.delayBetweenRequests = this.config.delayBetweenRequests || 2000
  }

  /**
   * Main scraping method - must be implemented by subclasses
   */
  abstract scrape(query: string): Promise<ScrapedLead[]>

  /**
   * Rate limiting - wait between requests
   */
  protected async delay(ms?: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms || this.delayBetweenRequests))
  }

  /**
   * Validate scraped lead data
   * Note: Phone is optional - we can import leads without phones and fill them in later
   */
  protected validateLead(lead: Partial<ScrapedLead>): lead is ScrapedLead {
    if (!lead.name || lead.name.trim().length === 0) return false
    if (!lead.city) return false
    if (!lead.category) return false

    // Phone is optional - if provided, validate it
    if (lead.phone && lead.phone.trim().length > 0) {
      const cleanPhone = lead.phone.replace(/\D/g, '')
      if (cleanPhone.length < 10) {
        // Invalid phone format - remove it but still allow the lead
        lead.phone = ''
      }
    }

    return true
  }

  /**
   * Normalize phone number to Nigerian format
   */
  protected normalizePhone(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '')
    
    // Handle Nigerian formats
    if (cleaned.startsWith('234')) {
      cleaned = cleaned.substring(3)
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    
    // Return with country code
    return `234${cleaned}`
  }

  /**
   * Extract area from address (simple heuristic)
   */
  protected extractArea(address?: string): string | undefined {
    if (!address) return undefined
    
    // Common Lagos/Abuja area patterns
    const areaPatterns = [
      /(Victoria Island|VI)/i,
      /(Lekki|Ikoyi|Surulere|Ikeja|Yaba|Gbagada|Maryland)/i,
      /(Wuse|Maitama|Asokoro|Garki|Gwarinpa|Kubwa)/i,
    ]
    
    for (const pattern of areaPatterns) {
      const match = address.match(pattern)
      if (match) return match[1]
    }
    
    return undefined
  }

  /**
   * Infer category from business name/description
   */
  protected inferCategory(name: string, description?: string): CustomerType {
    const text = `${name} ${description || ''}`.toLowerCase()
    
    if (text.match(/\b(distributor|distribution|distribute)\b/)) return CustomerType.DISTRIBUTOR
    if (text.match(/\b(supplier|supplies|supply)\b/)) return CustomerType.SUPPLIER
    if (text.match(/\b(consumer|buyer|end.?user|outlet)\b/)) return CustomerType.CONSUMER
    if (text.match(/\b(gym|fitness|workout|exercise)\b/)) return CustomerType.GYM
    if (text.match(/\b(event|venue|hall|center)\b/)) return CustomerType.EVENT_CENTER
    if (text.match(/\b(club|nightclub|bar)\b/)) return CustomerType.CLUB
    if (text.match(/\b(lounge|restaurant|cafe)\b/)) return CustomerType.LOUNGE
    if (text.match(/\b(office|corporate|business)\b/)) return CustomerType.OFFICE
    if (text.match(/\b(shop|store|retail|supermarket)\b/)) return CustomerType.SMALL_RETAILER
    
    return CustomerType.OTHER
  }

  /**
   * Error handling wrapper
   */
  protected handleError(error: unknown, context: string): string {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[${this.constructor.name}] Error in ${context}:`, message)
    return message
  }
}
