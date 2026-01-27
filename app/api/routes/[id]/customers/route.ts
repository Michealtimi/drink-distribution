import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { customerId, sequence } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing required field: customerId' },
        { status: 400 }
      )
    }

    // Get max sequence if not provided
    let finalSequence = sequence
    if (finalSequence === undefined) {
      const maxSequence = await prisma.routeCustomer.findFirst({
        where: { routeId: params.id },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      })
      finalSequence = (maxSequence?.sequence || 0) + 1
    }

    const routeCustomer = await prisma.routeCustomer.create({
      data: {
        routeId: params.id,
        customerId,
        sequence: finalSequence,
      },
      include: {
        customer: true,
      },
    })

    return NextResponse.json(routeCustomer, { status: 201 })
  } catch (error) {
    console.error('Error adding customer to route:', error)
    return NextResponse.json(
      { error: 'Failed to add customer to route' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: customerId' },
        { status: 400 }
      )
    }

    await prisma.routeCustomer.deleteMany({
      where: {
        routeId: params.id,
        customerId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing customer from route:', error)
    return NextResponse.json(
      { error: 'Failed to remove customer from route' },
      { status: 500 }
    )
  }
}
