import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMessage, getWhatsAppLink } from '@/lib/message-generator'
import { scheduleFollowUpsForLead } from '@/lib/follow-up-scheduler'
import { LeadStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const message = generateMessage(lead.status, {
      name: lead.name,
      category: lead.category,
      city: lead.city,
      area: lead.area || undefined,
    })

    const whatsappLink = getWhatsAppLink(lead.phone, message)

    return NextResponse.json({
      message,
      whatsappLink,
      phone: lead.phone,
    })
  } catch (error) {
    console.error('Error generating message:', error)
    return NextResponse.json(
      { error: 'Failed to generate message' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Update lead status to MESSAGED if not already
    if (lead.status !== LeadStatus.MESSAGED && lead.status !== LeadStatus.INTERESTED) {
      await prisma.lead.update({
        where: { id: params.id },
        data: { status: LeadStatus.MESSAGED },
      })

      // Auto-schedule follow-ups
      await scheduleFollowUpsForLead(params.id)
    }

    const message = generateMessage(LeadStatus.MESSAGED, {
      name: lead.name,
      category: lead.category,
      city: lead.city,
      area: lead.area || undefined,
    })

    const whatsappLink = getWhatsAppLink(lead.phone, message)

    return NextResponse.json({
      message,
      whatsappLink,
      phone: lead.phone,
      followUpsScheduled: true,
    })
  } catch (error) {
    console.error('Error marking as messaged:', error)
    return NextResponse.json(
      { error: 'Failed to mark as messaged' },
      { status: 500 }
    )
  }
}
