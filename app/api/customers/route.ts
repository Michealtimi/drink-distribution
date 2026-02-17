import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { internalError } from '@/lib/api-errors'
import { parseListLimit } from '@/lib/validations/api-schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') as string | null
    const take = parseListLimit(searchParams)

    const customers = await prisma.customer.findMany({
      where: { ...(city ? { city: city as any } : {}) },
      orderBy: { createdAt: 'desc' },
      take,
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return internalError('Failed to fetch customers')
  }
}
