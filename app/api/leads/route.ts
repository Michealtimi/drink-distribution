import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus, City, CustomerType } from '@prisma/client'
import { sortLeadsByPriority } from '@/lib/lead-priority'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as LeadStatus | null
    const city = searchParams.get('city') as City | null
    const category = searchParams.get('category') as CustomerType | null
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Handle priority sorting separately (requires in-memory sorting)
    if (sortBy === 'priority') {
      const leads = await prisma.lead.findMany({
        where: {
          ...(status && { status }),
          ...(city && { city }),
          ...(category && { category }),
        },
        take: 1000, // Increased limit for better sorting
      })
      
      // Sort by priority
      const sortedLeads = sortLeadsByPriority(leads)
      return NextResponse.json(sortedLeads)
    }

    // Build orderBy clause for other sort options
    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder
    } else if (sortBy === 'city') {
      orderBy.city = sortOrder
    } else if (sortBy === 'category') {
      orderBy.category = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const leads = await prisma.lead.findMany({
      where: {
        ...(status && { status }),
        ...(city && { city }),
        ...(category && { category }),
      },
      orderBy,
      take: 1000, // Increased limit for better sorting
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, address, area, city, category, source, notes } = body

    // Validate required fields
    if (!name || !city || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, city, category' },
        { status: 400 }
      )
    }

    // At least one of phone or email must be provided
    if (!phone && !email) {
      return NextResponse.json(
        { error: 'At least one of phone or email is required' },
        { status: 400 }
      )
    }

    // Check for duplicate by phone (if provided)
    if (phone) {
      const existingByPhone = await prisma.lead.findFirst({
        where: { phone },
      })

      if (existingByPhone) {
        return NextResponse.json(
          { error: 'Lead with this phone number already exists', lead: existingByPhone },
          { status: 409 }
        )
      }
    }

    // Check for duplicate by email (if provided)
    if (email) {
      const existingByEmail = await prisma.lead.findFirst({
        where: { email: email.trim().toLowerCase() },
      })

      if (existingByEmail) {
        return NextResponse.json(
          { error: 'Lead with this email already exists', lead: existingByEmail },
          { status: 409 }
        )
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone: phone || 'NO_PHONE', // Use placeholder if no phone
        email: email ? email.trim().toLowerCase() : null,
        address: address || null,
        area: area || null,
        city: city as City,
        category: category as CustomerType,
        source: source || null,
        notes: notes || null,
        status: LeadStatus.UNVERIFIED,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
