import { LeadStatus, type City } from '@prisma/client'
import { loadExistingPhones, deduplicateLeads } from './lead-deduplicator'
import { batchImportLeads } from './lead-import-pipeline'
import { autoValidateScrapedLeads } from './lead-validator'
import type { ScrapedLead } from './scrapers/base-scraper'

export interface ImportFromScrapeResult {
  leadsFound: number
  duplicates: number
  imported: number
  errors: string[]
  validated: number
  verified: number
  invalid: number
}

/**
 * Service for deduplicating, batch-importing, and optionally auto-validating scraped leads.
 * Used by ScraperManager and any other flow that imports scraped leads (e.g. future CSV from scrapers).
 */
export async function importFromScrape(
  scrapedLeads: ScrapedLead[],
  sourceName: string,
  options?: { city?: City | null; onlyWhatsAppChecked?: boolean }
): Promise<ImportFromScrapeResult> {
  const result: ImportFromScrapeResult = {
    leadsFound: scrapedLeads.length,
    duplicates: 0,
    imported: 0,
    errors: [],
    validated: 0,
    verified: 0,
    invalid: 0,
  }

  if (scrapedLeads.length === 0) return result

  const existingPhones = await loadExistingPhones(
    options?.city ? [options.city] : undefined
  )
  const { unique, duplicates } = await deduplicateLeads(scrapedLeads, existingPhones)
  result.duplicates = duplicates.length

  const { imported, errors } = await batchImportLeads(unique, sourceName, {
    defaultHasWhatsApp: options?.onlyWhatsAppChecked ?? false,
  })
  result.imported = imported
  result.errors = errors

  if (imported > 0) {
    try {
      const validation = await autoValidateScrapedLeads({ statuses: [LeadStatus.SCRAPED] })
      result.validated = validation.validated
      result.verified = validation.verified
      result.invalid = validation.invalid
    } catch (validationError) {
      console.error('[LeadImportService] Auto-validation error:', validationError)
    }
  }

  return result
}
