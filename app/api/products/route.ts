import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const supplierId = searchParams.get('supplierId')
    const isActive = searchParams.get('isActive')

    const products = await prisma.product.findMany({
      where: {
        ...(category && { category }),
        ...(supplierId && { supplierId }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, unitPrice, unit, supplierId, notes, isActive } = body

    if (!name || !category || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'Name, category, and unit price are required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        unitPrice: parseFloat(unitPrice),
        unit: unit || 'can',
        supplierId: supplierId || null,
        notes,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Product with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
