import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, scheduledFor, message, notes } = body

    if (!leadId || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields: leadId, scheduledFor' },
        { status: 400 }
      )
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        scheduledFor: new Date(scheduledFor),
        message: message || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(followUp, { status: 201 })
  } catch (error) {
    console.error('Error creating follow-up:', error)
    return NextResponse.json(
      { error: 'Failed to create follow-up' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const leadId = searchParams.get('leadId')
    const completed = searchParams.get('completed')

    const where: any = {}
    if (leadId) where.leadId = leadId
    if (completed !== null) where.completed = completed === 'true'

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: {
        scheduledFor: 'asc',
      },
      include: {
        lead: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(followUps)
  } catch (error) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups' },
      { status: 500 }
    )
  }
}
