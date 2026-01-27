import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        followUps: {
          orderBy: { scheduledFor: 'asc' },
        },
        customer: true,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, hasWhatsApp, notes, name, phone, email, address, area } = body

    // Get current lead to check if we're removing both phone and email
    const currentLead = await prisma.lead.findUnique({
      where: { id: params.id },
      select: { phone: true, email: true },
    })

    if (!currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Validate: at least one of phone or email must be present after update
    const newPhone = phone !== undefined ? phone : currentLead.phone
    const newEmail = email !== undefined ? email : currentLead.email

    if (!newPhone || newPhone === 'NO_PHONE' || newPhone.trim() === '') {
      if (!newEmail || newEmail.trim() === '') {
        return NextResponse.json(
          { error: 'At least one of phone or email is required' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (status) updateData.status = status as LeadStatus
    if (hasWhatsApp !== undefined) updateData.hasWhatsApp = hasWhatsApp
    if (notes !== undefined) updateData.notes = notes
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null
    if (address !== undefined) updateData.address = address
    if (area !== undefined) updateData.area = area

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.lead.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
