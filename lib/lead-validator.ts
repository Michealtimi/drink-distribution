import { prisma } from './prisma'
import { LeadStatus } from '@prisma/client'

/**
 * Enhanced lead validation rules
 * Automatically validates leads and marks them as VERIFIED or INVALID
 */
export interface ValidationResult {
  isValid: boolean
  status: LeadStatus
  reasons: string[]
  score: number // 0-100, higher is better
}

/**
 * Validate a single lead with enhanced rules
 */
export async function validateLead(leadId: string): Promise<ValidationResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  })

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`)
  }

  const reasons: string[] = []
  let score = 100

  // 1. Phone validation (30 points)
  const phoneValid = validatePhone(lead.phone)
  if (!phoneValid.valid) {
    reasons.push(`Phone: ${phoneValid.reason}`)
    score -= 30
  }

  // 2. Name validation (20 points)
  const nameValid = validateName(lead.name)
  if (!nameValid.valid) {
    reasons.push(`Name: ${nameValid.reason}`)
    score -= 20
  }

  // 3. Address/Area validation (15 points)
  if (!lead.address && !lead.area) {
    reasons.push('Missing address and area')
    score -= 15
  } else if (!lead.area && lead.address) {
    // Area can be inferred, so only minor penalty
    score -= 5
  }

  // 4. Category validation (10 points)
  if (lead.category === 'OTHER') {
    reasons.push('Category is OTHER (not specific)')
    score -= 10
  }

  // 5. Source validation (10 points)
  if (!lead.source) {
    reasons.push('No source recorded')
    score -= 10
  }

  // 6. Duplicate check (15 points)
  const duplicateCheck = await checkForDuplicates(lead)
  if (duplicateCheck.isDuplicate) {
    reasons.push(`Possible duplicate: ${duplicateCheck.reason}`)
    score -= 15
  }

  // Determine status based on score
  let status: LeadStatus
  if (score >= 80) {
    status = LeadStatus.VERIFIED
  } else if (score >= 50) {
    status = LeadStatus.UNVERIFIED
  } else {
    status = LeadStatus.INVALID
  }

  return {
    isValid: score >= 50,
    status,
    reasons,
    score,
  }
}

/**
 * Validate phone number format
 */
function validatePhone(phone: string): { valid: boolean; reason?: string } {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')

  // Must start with 234 (Nigerian country code)
  if (!cleaned.startsWith('234')) {
    return { valid: false, reason: 'Must start with 234' }
  }

  // Must be 13 digits total (234 + 10 digits)
  if (cleaned.length !== 13) {
    return { valid: false, reason: `Invalid length: ${cleaned.length} (expected 13)` }
  }

  // Check for common invalid patterns
  const last10 = cleaned.substring(3)
  if (last10.match(/^0{10}$/)) {
    return { valid: false, reason: 'All zeros' }
  }
  if (last10.match(/^1{10}$/)) {
    return { valid: false, reason: 'All ones' }
  }

  return { valid: true }
}

/**
 * Validate business name
 */
function validateName(name: string): { valid: boolean; reason?: string } {
  const trimmed = name.trim()

  // Must have at least 2 characters
  if (trimmed.length < 2) {
    return { valid: false, reason: 'Too short' }
  }

  // Must not be all numbers
  if (/^\d+$/.test(trimmed)) {
    return { valid: false, reason: 'Only numbers' }
  }

  // Must not be common invalid patterns
  const invalidPatterns = [
    /^(test|example|sample|demo|n\/a|na|none)$/i,
    /^(business|company|enterprise|corp|inc)$/i,
  ]
  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'Generic/invalid name' }
    }
  }

  return { valid: true }
}

/**
 * Check for potential duplicates (beyond exact phone match)
 */
async function checkForDuplicates(lead: any): Promise<{
  isDuplicate: boolean
  reason?: string
}> {
  // Check for similar names in same area/city
  const similar = await prisma.lead.findFirst({
    where: {
      AND: [
        { id: { not: lead.id } },
        { name: { contains: lead.name.substring(0, 5), mode: 'insensitive' } },
        { city: lead.city },
        lead.area
          ? { area: { contains: lead.area, mode: 'insensitive' } }
          : {},
      ],
    },
  })

  if (similar) {
    return { isDuplicate: true, reason: `Similar to ${similar.name}` }
  }

  return { isDuplicate: false }
}

/**
 * Batch validate multiple leads
 */
export async function validateLeadsBatch(leadIds: string[]): Promise<{
  validated: number
  verified: number
  invalid: number
  errors: string[]
}> {
  let validated = 0
  let verified = 0
  let invalid = 0
  const errors: string[] = []

  for (const leadId of leadIds) {
    try {
      const result = await validateLead(leadId)

      // Update lead status
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: result.status },
      })

      validated++
      if (result.status === LeadStatus.VERIFIED) {
        verified++
      } else if (result.status === LeadStatus.INVALID) {
        invalid++
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push(`Lead ${leadId}: ${errorMsg}`)
    }
  }

  return { validated, verified, invalid, errors }
}

/**
 * Auto-validate all SCRAPED leads
 */
export async function autoValidateScrapedLeads(): Promise<{
  validated: number
  verified: number
  invalid: number
}> {
  // Get all SCRAPED leads
  const scrapedLeads = await prisma.lead.findMany({
    where: { status: LeadStatus.SCRAPED },
    select: { id: true },
  })

  const leadIds = scrapedLeads.map((l) => l.id)
  const result = await validateLeadsBatch(leadIds)

  return {
    validated: result.validated,
    verified: result.verified,
    invalid: result.invalid,
  }
}
