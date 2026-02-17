import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CustomerType } from '@prisma/client'
import { badRequest, internalError } from '@/lib/api-errors'
import { createBusinessSchema, parseListLimit } from '@/lib/validations/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') as string | null
    const category = searchParams.get('category') as string | null
    const take = parseListLimit(searchParams)

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
      orderBy: { createdAt: 'desc' },
      take,
    })

    return NextResponse.json(businesses)
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return internalError('Failed to fetch businesses')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createBusinessSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten())
    }
    const data = parsed.data

    const business = await prisma.business.create({
      data: {
        name: data.name,
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        address: data.address ?? undefined,
        area: data.area ?? undefined,
        city: data.city,
        category: data.category,
        website: data.website ?? undefined,
        notes: data.notes ?? undefined,
      },
    })

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error('Error creating business:', error)
    return internalError('Failed to create business')
  }
}
