import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { City } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') as City | null

    const routes = await prisma.route.findMany({
      where: {
        ...(city && { city }),
      },
      include: {
        customers: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                area: true,
              },
            },
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
      orderBy: [
        { city: 'asc' },
        { dayOfWeek: 'asc' },
      ],
    })

    return NextResponse.json(routes)
  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, city, dayOfWeek, area, isActive } = body

    if (!name || !city || !dayOfWeek) {
      return NextResponse.json(
        { error: 'Missing required fields: name, city, dayOfWeek' },
        { status: 400 }
      )
    }

    const route = await prisma.route.create({
      data: {
        name,
        city: city as City,
        dayOfWeek,
        area: area || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(route, { status: 201 })
  } catch (error) {
    console.error('Error creating route:', error)
    return NextResponse.json(
      { error: 'Failed to create route' },
      { status: 500 }
    )
  }
}
