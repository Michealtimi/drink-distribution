import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scheduleFollowUpsForLead } from '@/lib/follow-up-scheduler'

/**
 * POST /api/leads/bulk-mark-messaged
 * Body: { leadIds: string[] }
 * Only leads with status VERIFIED are updated to MESSAGED and get follow-ups scheduled.
 * Others are skipped (no error). You still send WhatsApp manually.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadIds } = body

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'leadIds must be a non-empty array' },
        { status: 400 }
      )
    }

    const verified = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        status: 'VERIFIED',
      },
      select: { id: true },
    })

    const ids = verified.map((l) => l.id)
    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        skipped: leadIds.length,
        message: 'No Verified leads in selection. Only Verified leads can be marked as messaged.',
      })
    }

    await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data: { status: 'MESSAGED' },
    })

    for (const leadId of ids) {
      await scheduleFollowUpsForLead(leadId)
    }

    return NextResponse.json({
      success: true,
      updated: ids.length,
      skipped: leadIds.length - ids.length,
      message: `${ids.length} lead(s) marked as messaged. Follow-ups scheduled.`,
    })
  } catch (error) {
    console.error('Bulk mark as messaged error:', error)
    return NextResponse.json(
      { error: 'Failed to mark leads as messaged' },
      { status: 500 }
    )
  }
}
