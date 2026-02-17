import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound, badRequest, internalError } from '@/lib/api-errors'
import { updateSupplierSchema } from '@/lib/validations/api-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        productList: {
          select: { id: true, name: true, category: true, unitPrice: true, unit: true },
        },
      },
    })

    if (!supplier) return notFound('Supplier not found')
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return internalError('Failed to fetch supplier')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsed = updateSupplierSchema.safeParse(body)
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name != null && { name: parsed.data.name }),
        ...(parsed.data.contactName !== undefined && { contactName: parsed.data.contactName ?? null }),
        ...(parsed.data.phone != null && { phone: parsed.data.phone }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email ?? null }),
        ...(parsed.data.address !== undefined && { address: parsed.data.address ?? null }),
        ...(parsed.data.city !== undefined && { city: parsed.data.city ?? null }),
        ...(parsed.data.products !== undefined && { products: parsed.data.products }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes ?? null }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
    })

    return NextResponse.json(supplier)
  } catch (error: unknown) {
    console.error('Error updating supplier:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025')
      return notFound('Supplier not found')
    return internalError('Failed to update supplier')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.supplier.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting supplier:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025')
      return notFound('Supplier not found')
    return internalError('Failed to delete supplier')
  }
}
