import { prisma } from './prisma'
import { ScrapedLead } from './scrapers/base-scraper'

/**
 * Check if a lead already exists in the database
 * Checks by phone number (exact match) and name + area (fuzzy)
 */
export async function findDuplicateLead(lead: ScrapedLead) {
  // First check by phone (exact match)
  const byPhone = await prisma.lead.findFirst({
    where: {
      phone: lead.phone,
    },
  })

  if (byPhone) {
    return { duplicate: byPhone, reason: 'phone' }
  }

  // Then check by name + area (fuzzy match)
  if (lead.area) {
    const byNameAndArea = await prisma.lead.findFirst({
      where: {
        name: {
          contains: lead.name,
          mode: 'insensitive',
        },
        area: {
          contains: lead.area,
          mode: 'insensitive',
        },
        city: lead.city,
      },
    })

    if (byNameAndArea) {
      return { duplicate: byNameAndArea, reason: 'name_and_area' }
    }
  }

  // Check by name only (if no area)
  const byName = await prisma.lead.findFirst({
    where: {
      name: {
        contains: lead.name,
        mode: 'insensitive',
      },
      city: lead.city,
    },
  })

  if (byName) {
    // Only consider duplicate if names are very similar (avoid false positives)
    const similarity = calculateSimilarity(lead.name, byName.name)
    if (similarity > 0.8) {
      return { duplicate: byName, reason: 'name_similarity' }
    }
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
 * Batch deduplication for multiple leads
 */
export async function deduplicateLeads(leads: ScrapedLead[]): Promise<{
  unique: ScrapedLead[]
  duplicates: Array<{ lead: ScrapedLead; existing: any; reason: string }>
}> {
  const unique: ScrapedLead[] = []
  const duplicates: Array<{ lead: ScrapedLead; existing: any; reason: string }> = []

  for (const lead of leads) {
    const { duplicate, reason } = await findDuplicateLead(lead)
    if (duplicate) {
      duplicates.push({ lead, existing: duplicate, reason: reason || 'unknown' })
    } else {
      unique.push(lead)
    }
  }

  return { unique, duplicates }
}
