import { prisma } from './prisma'
import { LeadStatus, City, CustomerType } from '@prisma/client'
import type { ScrapedLead } from './scrapers/base-scraper'

const BATCH_SIZE = 200

export interface BatchImportResult {
  imported: number
  errors: string[]
}

export interface BatchImportOptions {
  /** When true, set hasWhatsApp: true on all created leads (e.g. after WhatsApp check before import) */
  defaultHasWhatsApp?: boolean
}

/**
 * Import a batch of scraped leads using createMany in chunks.
 * Reduces DB round-trips from O(N) to O(N / BATCH_SIZE).
 */
export async function batchImportLeads(
  leads: ScrapedLead[],
  source: string,
  options?: BatchImportOptions
): Promise<BatchImportResult> {
  const errors: string[] = []
  let imported = 0
  const hasWhatsAppDefault = options?.defaultHasWhatsApp ?? false

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const chunk = leads.slice(i, i + BATCH_SIZE)
    const data = chunk.map((lead) => ({
      name: lead.name,
      phone: (lead.phone && lead.phone.trim()) ? lead.phone.trim() : '',
      address: lead.address ?? null,
      area: lead.area ?? null,
      city: lead.city,
      category: lead.category,
      status: LeadStatus.SCRAPED as LeadStatus,
      source,
      hasWhatsApp: (lead as ScrapedLead & { hasWhatsApp?: boolean }).hasWhatsApp ?? hasWhatsAppDefault,
    }))

    try {
      const result = await prisma.lead.createMany({
        data,
        skipDuplicates: true,
      })
      imported += result.count
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`)
      // Optionally fall back to one-by-one for this chunk to salvage partial success
        for (const lead of chunk) {
          try {
          await prisma.lead.create({
            data: {
              name: lead.name,
              phone: (lead.phone && lead.phone.trim()) ? lead.phone.trim() : '',
              address: lead.address ?? null,
              area: lead.area ?? null,
              city: lead.city,
              category: lead.category,
              status: LeadStatus.SCRAPED,
              source,
              hasWhatsApp: (lead as ScrapedLead & { hasWhatsApp?: boolean }).hasWhatsApp ?? hasWhatsAppDefault,
            },
          })
          imported++
        } catch (e) {
          errors.push(`${lead.name}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }
  }

  return { imported, errors }
}

/**
 * Data shape for CSV/from-contacts batch create.
 */
export interface LeadCreateInput {
  name: string
  phone: string
  email?: string | null
  address?: string | null
  area?: string | null
  city: City
  category: CustomerType
  source: string
  status?: LeadStatus
}

/**
 * Import a list of LeadCreateInput in batches (e.g. from CSV or from-contacts).
 * existingPhones and existingEmails are Sets of values already in DB to skip duplicates.
 */
export async function batchImportLeadRecords(
  records: LeadCreateInput[],
  existingPhones: Set<string>,
  existingEmails: Set<string>
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const toInsert: LeadCreateInput[] = []
  let skipped = 0

  for (const r of records) {
    const phone = (r.phone || '').trim()
    const email = (r.email || '').trim().toLowerCase()
    if (phone && existingPhones.has(phone)) {
      skipped++
      continue
    }
    if (email && existingEmails.has(email)) {
      skipped++
      continue
    }
    toInsert.push(r)
  }

  const errors: string[] = []
  let imported = 0
  const status = records[0]?.status ?? LeadStatus.SCRAPED

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const chunk = toInsert.slice(i, i + BATCH_SIZE)
    const data = chunk.map((r) => ({
      name: r.name,
      phone: r.phone,
      email: r.email ?? null,
      address: r.address ?? null,
      area: r.area ?? null,
      city: r.city,
      category: r.category,
      source: r.source,
      status: r.status ?? status,
    }))

    try {
      const result = await prisma.lead.createMany({
        data,
        skipDuplicates: true,
      })
      imported += result.count
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`)
    }
  }

  return { imported, skipped, errors }
}
