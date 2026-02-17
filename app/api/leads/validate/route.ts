import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus } from '@prisma/client'
import { autoValidateScrapedLeads, validateLead, validateLeadIds } from '@/lib/lead-validator'

const VALIDATABLE_STATUSES: LeadStatus[] = [LeadStatus.SCRAPED, LeadStatus.UNVERIFIED]

/**
 * POST /api/leads/validate
 * Body (optional): { leadIds?: string[] } to validate only selected leads.
 * Body (optional): { statuses?: string[] } to validate only leads in those statuses (default: SCRAPED, UNVERIFIED).
 * Without body: validates all SCRAPED and UNVERIFIED leads.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { leadIds?: string[]; statuses?: string[] } = {}
    try {
      body = await request.json()
    } catch {
      // no body
    }

    if (body.leadIds && Array.isArray(body.leadIds) && body.leadIds.length > 0) {
      const result = await validateLeadIds(body.leadIds)
      return NextResponse.json({
        success: true,
        ...result,
        message: `Validated ${result.validated} leads: ${result.verified} verified, ${result.invalid} invalid`,
      })
    }

    const statuses =
      body.statuses && body.statuses.length > 0
        ? (body.statuses.filter((s) => VALIDATABLE_STATUSES.includes(s as LeadStatus)) as LeadStatus[])
        : [LeadStatus.SCRAPED, LeadStatus.UNVERIFIED]

    const result = await autoValidateScrapedLeads({ statuses })

    return NextResponse.json({
      success: true,
      ...result,
      message:
        result.validated === 0
        ? 'No leads to validate (only SCRAPED or UNVERIFIED leads are validated). Add or scrape leads first.'
        : `Validated ${result.validated} leads: ${result.verified} verified, ${result.invalid} invalid`,
    })
  } catch (error) {
    console.error('Error validating leads:', error)
    return NextResponse.json(
      { error: 'Failed to validate leads', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leads/validate?leadId=xxx
 * Validate a specific lead
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const leadId = searchParams.get('leadId')

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId parameter is required' },
        { status: 400 }
      )
    }

    const result = await validateLead(leadId)

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: result.status },
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Error validating lead:', error)
    return NextResponse.json(
      { error: 'Failed to validate lead', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
