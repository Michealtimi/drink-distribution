import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus } from '@prisma/client'

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

    if (lead.customer) {
      return NextResponse.json(
        { error: 'Lead already converted to customer' },
        { status: 400 }
      )
    }

    // Convert lead to customer
    const customer = await prisma.customer.create({
      data: {
        leadId: lead.id,
        name: lead.name,
        phone: lead.phone,
        address: lead.address,
        area: lead.area,
        city: lead.city,
        category: lead.category,
      },
    })

    // Update lead status
    await prisma.lead.update({
      where: { id: params.id },
      data: { status: LeadStatus.CUSTOMER },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error converting lead:', error)
    return NextResponse.json(
      { error: 'Failed to convert lead to customer' },
      { status: 500 }
    )
  }
}
