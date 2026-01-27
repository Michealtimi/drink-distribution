import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { City } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') as City | null

    const customers = await prisma.customer.findMany({
      where: {
        ...(city && { city }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
