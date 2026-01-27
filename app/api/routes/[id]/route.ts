import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { City } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        customers: {
          include: {
            customer: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    })

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    return NextResponse.json(route)
  } catch (error) {
    console.error('Error fetching route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch route' },
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
    const { name, city, dayOfWeek, area, isActive } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (city) updateData.city = city as City
    if (dayOfWeek) updateData.dayOfWeek = dayOfWeek
    if (area !== undefined) updateData.area = area
    if (isActive !== undefined) updateData.isActive = isActive

    const route = await prisma.route.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(route)
  } catch (error) {
    console.error('Error updating route:', error)
    return NextResponse.json(
      { error: 'Failed to update route' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.route.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting route:', error)
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    )
  }
}
