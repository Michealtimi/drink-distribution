import { prisma } from './prisma'
import type { City } from '@prisma/client'
import { ScrapedLead } from './scrapers/base-scraper'

/**
 * Load existing phone numbers from DB (optionally by city) for O(1) duplicate check.
 * Call once per batch to avoid N round-trips.
 */
export async function loadExistingPhones(cities?: City[]): Promise<Set<string>> {
  const phones = await prisma.lead.findMany({
    where: cities?.length ? { city: { in: cities } } : undefined,
    select: { phone: true },
  })
  const set = new Set<string>()
  for (const row of phones) {
    if (row.phone && row.phone.trim()) set.add(row.phone.trim())
  }
  return set
}

/**
 * Check if a lead already exists in the database.
 * When existingPhones Set is provided, phone check is O(1) without a DB call.
 */
export async function findDuplicateLead(
  lead: ScrapedLead,
  existingPhones?: Set<string>
): Promise<{ duplicate: { id: string; name: string; phone: string } | null; reason: string | null }> {
  // Only check by phone when lead has a real phone (avoid treating all no-phone leads as duplicates)
  const hasPhone = lead.phone && lead.phone.trim().length > 0 && !/^2340+$/.test(lead.phone.replace(/\D/g, ''))
  if (hasPhone) {
    const phoneKey = lead.phone.trim()
    if (existingPhones?.has(phoneKey)) {
      return { duplicate: { id: '', name: '', phone: phoneKey }, reason: 'phone' }
    }
    const byPhone = await prisma.lead.findFirst({
      where: { phone: lead.phone },
      select: { id: true, name: true, phone: true },
    })
    if (byPhone) return { duplicate: byPhone, reason: 'phone' }
  }

  // Then check by name + area (fuzzy match) — only when no phone match; may not use indexes
  if (lead.area) {
    const byNameAndArea = await prisma.lead.findFirst({
      where: {
        name: { contains: lead.name, mode: 'insensitive' },
        area: { contains: lead.area, mode: 'insensitive' },
        city: lead.city,
      },
      select: { id: true, name: true, phone: true },
    })
    if (byNameAndArea) return { duplicate: byNameAndArea, reason: 'name_and_area' }
  }

  // Check by name only (if no area)
  const byName = await prisma.lead.findFirst({
    where: {
      name: { contains: lead.name, mode: 'insensitive' },
      city: lead.city,
    },
    select: { id: true, name: true, phone: true },
  })
  if (byName) {
    const similarity = calculateSimilarity(lead.name, byName.name)
    if (similarity > 0.8) return { duplicate: byName, reason: 'name_similarity' }
  }

  return { duplicate: null, reason: null }
}

/**
 * Simple string similarity (Jaro-Winkler-like)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1.0
  if (s1.length === 0 || s2.length === 0) return 0.0

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9
  }

  // Simple character overlap
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++
    }
  }

  return matches / longer.length
}

/**
 * Batch deduplication for multiple leads.
 * Pass existingPhones from loadExistingPhones() to avoid N DB round-trips for phone checks.
 */
export async function deduplicateLeads(
  leads: ScrapedLead[],
  existingPhones?: Set<string>
): Promise<{
  unique: ScrapedLead[]
  duplicates: Array<{ lead: ScrapedLead; existing: { id: string; name: string; phone: string }; reason: string }>
}> {
  const unique: ScrapedLead[] = []
  const duplicates: Array<{
    lead: ScrapedLead
    existing: { id: string; name: string; phone: string }
    reason: string
  }> = []

  for (const lead of leads) {
    const { duplicate, reason } = await findDuplicateLead(lead, existingPhones)
    if (duplicate) {
      duplicates.push({ lead, existing: duplicate, reason: reason || 'unknown' })
    } else {
      unique.push(lead)
    }
  }

  return { unique, duplicates }
}
