import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { City, CustomerType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') as City | null
    const category = searchParams.get('category') as CustomerType | null

    const businesses = await prisma.business.findMany({
      where: {
        ...(city && { city }),
        ...(category && { category }),
      },
      include: {
        _count: {
          select: {
            leads: true,
            customers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(businesses)
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, address, area, city, category, website, notes } = body

    if (!name || !city || !category) {
      return NextResponse.json(
        { error: 'Name, city, and category are required' },
        { status: 400 }
      )
    }

    const business = await prisma.business.create({
      data: {
        name,
        phone,
        email,
        address,
        area,
        city,
        category,
        website,
        notes,
      },
    })

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error('Error creating business:', error)
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    )
  }
}
