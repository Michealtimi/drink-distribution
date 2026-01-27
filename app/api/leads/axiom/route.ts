import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus, City, CustomerType } from '@prisma/client'
import { deduplicateLeads } from '@/lib/lead-deduplicator'

interface AxiomLead {
  name: string
  phone?: string
  email?: string
  address?: string
  city: City
  category: CustomerType
  source?: string
}

interface AxiomRequest {
  leads: AxiomLead[]
  source?: string
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (Nigerian format)
 */
function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // Nigerian phone: 234 + 10 digits = 13 digits total
  return cleaned.length >= 10 && cleaned.length <= 13
}

/**
 * Normalize phone number to Nigerian format
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle Nigerian formats
  if (cleaned.startsWith('234')) {
    return cleaned.substring(0, 13) // Ensure max 13 digits
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  
  // Return with country code
  return `234${cleaned.substring(0, 10)}`
}

/**
 * Validate a single lead
 */
function validateLead(lead: AxiomLead, index: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name is required
  if (!lead.name || lead.name.trim().length === 0) {
    errors.push(`Lead ${index}: Missing required field 'name'`)
  }

  // City is required and must be valid
  if (!lead.city || (lead.city !== City.LAGOS && lead.city !== City.ABUJA)) {
    errors.push(`Lead ${index}: Invalid or missing 'city' (must be LAGOS or ABUJA)`)
  }

  // Category is required and must be valid
  const validCategories = Object.values(CustomerType)
  if (!lead.category || !validCategories.includes(lead.category)) {
    errors.push(`Lead ${index}: Invalid or missing 'category'`)
  }

  // At least one contact method required (phone OR email)
  if (!lead.phone && !lead.email) {
    errors.push(`Lead ${index}: At least one of 'phone' or 'email' is required`)
  }

  // Validate phone if provided
  if (lead.phone && lead.phone.trim().length > 0) {
    if (!validatePhone(lead.phone)) {
      errors.push(`Lead ${index}: Invalid phone format`)
    }
  }

  // Validate email if provided
  if (lead.email && lead.email.trim().length > 0) {
    if (!validateEmail(lead.email)) {
      errors.push(`Lead ${index}: Invalid email format`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Get current month for quota calculation
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Fetch recent Axiom imports (leads with source containing "Axiom")
    const recentLeads = await prisma.lead.findMany({
      where: {
        source: {
          not: null,
          contains: 'Axiom',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        name: true,
        source: true,
        createdAt: true,
        city: true,
        category: true,
      },
    })

    // Group by source and calculate statistics
    const sourceGroups = recentLeads.reduce((acc, lead) => {
      const source = lead.source || 'Axiom.ai'
      if (!acc[source]) {
        acc[source] = {
          source,
          count: 0,
          recent: [],
        }
      }
      acc[source].count++
      acc[source].recent.push({
        id: lead.id,
        name: lead.name,
        createdAt: lead.createdAt,
        city: lead.city,
        category: lead.category,
      })
      return acc
    }, {} as Record<string, { source: string; count: number; recent: any[] }>)

    // Calculate monthly statistics
    const monthlyLeads = await prisma.lead.findMany({
      where: {
        source: {
          not: null,
          contains: 'Axiom',
        },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    // Calculate quota estimate (150 leads per hour)
    const leadsImportedThisMonth = monthlyLeads.length
    const hoursUsed = leadsImportedThisMonth / 150
    const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Get total imported today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayLeads = await prisma.lead.count({
      where: {
        source: {
          not: null,
          contains: 'Axiom',
        },
        createdAt: {
          gte: startOfToday,
        },
      },
    })

    // Calculate success rate (leads with valid phone or email)
    const validLeads = await prisma.lead.count({
      where: {
        source: {
          not: null,
          contains: 'Axiom',
        },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        OR: [
          { phone: { not: 'NO_PHONE' } },
          { email: { not: null } },
        ],
      },
    })

    const successRate = monthlyLeads.length > 0 
      ? (validLeads / monthlyLeads.length) * 100 
      : 0

    return NextResponse.json({
      success: true,
      recentImports: Object.values(sourceGroups),
      statistics: {
        totalImportedToday: todayLeads,
        totalImportedThisMonth: leadsImportedThisMonth,
        successRate: Math.round(successRate * 100) / 100,
        hoursUsed: Math.round(hoursUsed * 100) / 100,
        daysRemaining,
        quotaLimit: 2.0, // 2 hours free quota
      },
      recentLeads: recentLeads.map(lead => ({
        id: lead.id,
        name: lead.name,
        source: lead.source,
        createdAt: lead.createdAt,
        city: lead.city,
        category: lead.category,
      })),
    })
  } catch (error) {
    console.error('Error fetching Axiom imports:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Axiom imports',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional API key authentication
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.AXIOM_API_KEY

    if (apiKey && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      if (token !== apiKey) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        )
      }
    }

    const body: AxiomRequest = await request.json()
    const { leads, source } = body

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'leads must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate all leads first
    const validationResults = leads.map((lead, index) => validateLead(lead, index))
    const allErrors = validationResults.flatMap((result) => result.errors)

    if (allErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: allErrors,
        },
        { status: 400 }
      )
    }

    // Normalize and prepare leads for deduplication
    const normalizedLeads = leads.map((lead) => ({
      name: lead.name.trim(),
      phone: lead.phone ? normalizePhone(lead.phone) : '',
      email: lead.email ? lead.email.trim().toLowerCase() : undefined,
      address: lead.address ? lead.address.trim() : undefined,
      area: undefined, // Can be extracted from address later
      city: lead.city,
      category: lead.category,
    }))

    // Convert to ScrapedLead format for deduplication (phone is required in ScrapedLead, so use empty string if no phone)
    const scrapedLeads = normalizedLeads.map((lead) => ({
      name: lead.name,
      phone: lead.phone || 'NO_PHONE', // Use placeholder for deduplication
      address: lead.address,
      area: lead.area,
      city: lead.city,
      category: lead.category,
    }))

    // Deduplicate
    const { unique, duplicates } = await deduplicateLeads(scrapedLeads)

    // Import unique leads in transaction
    const results = await prisma.$transaction(async (tx) => {
      const created = []
      const errors = []

      for (let i = 0; i < unique.length; i++) {
        const scrapedLead = unique[i]
        const normalizedLead = normalizedLeads.find(
          (nl) => nl.name === scrapedLead.name && nl.city === scrapedLead.city
        )

        try {
          // Check for duplicate by email if phone is not available
          if (!normalizedLead?.phone || normalizedLead.phone === 'NO_PHONE') {
            if (normalizedLead?.email) {
              const existingByEmail = await tx.lead.findFirst({
                where: {
                  email: normalizedLead.email,
                },
              })

              if (existingByEmail) {
                duplicates.push({
                  lead: scrapedLead,
                  existing: existingByEmail,
                  reason: 'email',
                })
                continue
              }
            }
          }

          const leadData: any = {
            name: normalizedLead!.name,
            phone: normalizedLead!.phone && normalizedLead.phone !== 'NO_PHONE' 
              ? normalizedLead.phone 
              : 'NO_PHONE', // Store placeholder if no phone
            address: normalizedLead!.address || null,
            area: normalizedLead!.area || null,
            city: normalizedLead!.city,
            category: normalizedLead!.category,
            status: LeadStatus.SCRAPED,
            source: source || 'Axiom.ai',
          }

          // Add email if provided
          if (normalizedLead!.email) {
            leadData.email = normalizedLead!.email
          }

          const createdLead = await tx.lead.create({
            data: leadData,
          })
          created.push(createdLead)
        } catch (error) {
          errors.push({
            lead: scrapedLead,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      return { created, errors }
    })

    return NextResponse.json({
      success: true,
      imported: results.created.length,
      duplicates: duplicates.length,
      errors: results.errors.length,
      message: 'Leads imported successfully',
    })
  } catch (error) {
    console.error('Error in Axiom.ai import:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import leads',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
