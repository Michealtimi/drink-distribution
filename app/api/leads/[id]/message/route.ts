import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMessage, getWhatsAppLink } from '@/lib/message-generator'
import { scheduleFollowUpsForLead } from '@/lib/follow-up-scheduler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = typeof params.id === 'string' ? params.id : params.id?.[0]
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const lead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const { content, fromTemplate } = await generateMessage(lead.status, {
      name: lead.name,
      category: lead.category,
      city: lead.city,
      area: lead.area || undefined,
    })

    const hasPhone = lead.phone && lead.phone !== 'NO_PHONE'
    const whatsappLink = hasPhone ? getWhatsAppLink(lead.phone, content) : ''

    return NextResponse.json({
      message: content,
      whatsappLink,
      phone: lead.phone || '',
      fromTemplate,
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
    const id = typeof params.id === 'string' ? params.id : params.id?.[0]
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const lead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.status !== 'MESSAGED' && lead.status !== 'INTERESTED') {
      await prisma.lead.update({
        where: { id },
        data: { status: 'MESSAGED' },
      })
      await scheduleFollowUpsForLead(id)
    }

    const { content, fromTemplate } = await generateMessage('MESSAGED', {
      name: lead.name,
      category: lead.category,
      city: lead.city,
      area: lead.area || undefined,
    })

    const hasPhone = lead.phone && lead.phone !== 'NO_PHONE'
    const whatsappLink = hasPhone ? getWhatsAppLink(lead.phone, content) : ''

    return NextResponse.json({
      message: content,
      whatsappLink,
      phone: lead.phone || '',
      followUpsScheduled: true,
      fromTemplate,
    })
  } catch (error) {
    console.error('Error marking as messaged:', error)
    return NextResponse.json(
      { error: 'Failed to mark as messaged' },
      { status: 500 }
    )
  }
}
