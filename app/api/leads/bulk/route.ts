import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus, City, CustomerType } from '@prisma/client'
import { deduplicateLeads } from '@/lib/lead-deduplicator'
import { ScrapedLead } from '@/lib/scrapers/base-scraper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leads, source } = body

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'leads must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate and normalize leads
    // At least one of phone or email must be provided
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i]
      if (!lead.phone && !lead.email) {
        return NextResponse.json(
          { error: `Lead ${i}: At least one of 'phone' or 'email' is required` },
          { status: 400 }
        )
      }
    }

    const scrapedLeads: ScrapedLead[] = leads.map((lead: any) => ({
      name: lead.name,
      phone: lead.phone || 'NO_PHONE', // Use placeholder if no phone
      address: lead.address,
      area: lead.area,
      city: lead.city as City,
      category: lead.category as CustomerType,
    }))

    // Deduplicate
    const { unique, duplicates } = await deduplicateLeads(scrapedLeads)

    // Import unique leads in transaction
    const results = await prisma.$transaction(async (tx) => {
      const created = []
      const errors = []

      for (let i = 0; i < unique.length; i++) {
        const lead = unique[i]
        const originalLead = leads.find(
          (l: any) => l.name === lead.name && l.city === lead.city
        )

        try {
          // Check for duplicate by email if phone is not available
          if (!originalLead?.phone && originalLead?.email) {
            const existingByEmail = await tx.lead.findFirst({
              where: {
                email: originalLead.email,
              },
            })

            if (existingByEmail) {
              duplicates.push({
                lead,
                existing: existingByEmail,
                reason: 'email',
              })
              continue
            }
          }

          const leadData: any = {
            name: lead.name,
            phone: lead.phone !== 'NO_PHONE' ? lead.phone : 'NO_PHONE',
            address: lead.address || null,
            area: lead.area || null,
            city: lead.city,
            category: lead.category,
            status: LeadStatus.SCRAPED,
            source: source || 'Bulk Import',
          }

          // Add email if provided
          if (originalLead?.email) {
            leadData.email = originalLead.email.trim().toLowerCase()
          }

          const createdLead = await tx.lead.create({
            data: leadData,
          })
          created.push(createdLead)
        } catch (error) {
          errors.push({
            lead,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      return { created, errors }
    })

    return NextResponse.json({
      success: true,
      created: results.created.length,
      duplicates: duplicates.length,
      errors: results.errors.length,
      details: {
        created: results.created,
        duplicates: duplicates.map(d => ({
          lead: d.lead,
          existingId: d.existing.id,
          reason: d.reason,
        })),
        errors: results.errors,
      },
    })
  } catch (error) {
    console.error('Error in bulk import:', error)
    return NextResponse.json(
      { error: 'Failed to import leads', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
