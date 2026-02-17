import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { City } from '@prisma/client'
import { badRequest, internalError } from '@/lib/api-errors'
import { createSupplierSchema, parseListLimit } from '@/lib/validations/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') as City | null
    const isActive = searchParams.get('isActive')
    const take = parseListLimit(searchParams)

    const suppliers = await prisma.supplier.findMany({
      where: {
        ...(city && { city }),
        ...(isActive !== null && isActive !== undefined && { isActive: isActive === 'true' }),
      },
      include: {
        productList: {
          where: { isActive: true },
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return internalError('Failed to fetch suppliers')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createSupplierSchema.safeParse(body)
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())

    const supplier = await prisma.supplier.create({
      data: {
        name: parsed.data.name,
        contactName: parsed.data.contactName ?? undefined,
        phone: parsed.data.phone,
        email: parsed.data.email ?? undefined,
        address: parsed.data.address ?? undefined,
        city: parsed.data.city ?? undefined,
        products: parsed.data.products,
        notes: parsed.data.notes ?? undefined,
        isActive: parsed.data.isActive,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return internalError('Failed to create supplier')
  }
}
