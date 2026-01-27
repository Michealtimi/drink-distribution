import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { customerIds } = body // Array of customer IDs in new order

    if (!Array.isArray(customerIds)) {
      return NextResponse.json(
        { error: 'customerIds must be an array' },
        { status: 400 }
      )
    }

    // Update sequence for each customer
    await prisma.$transaction(
      customerIds.map((customerId, index) =>
        prisma.routeCustomer.updateMany({
          where: {
            routeId: params.id,
            customerId,
          },
          data: {
            sequence: index + 1,
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering route:', error)
    return NextResponse.json(
      { error: 'Failed to reorder route' },
      { status: 500 }
    )
  }
}
