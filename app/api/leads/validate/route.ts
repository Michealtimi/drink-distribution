import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autoValidateScrapedLeads, validateLead } from '@/lib/lead-validator'

/**
 * POST /api/leads/validate
 * Auto-validate all SCRAPED leads
 */
export async function POST(request: NextRequest) {
  try {
    const result = await autoValidateScrapedLeads()

    return NextResponse.json({
      success: true,
      ...result,
      message: `Validated ${result.validated} leads: ${result.verified} verified, ${result.invalid} invalid`,
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
