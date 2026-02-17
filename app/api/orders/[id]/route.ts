import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound, badRequest, internalError } from '@/lib/api-errors'
import { updateOrderSchema } from '@/lib/validations/api-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })

    if (!order) return notFound('Order not found')
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return internalError('Failed to fetch order')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsed = updateOrderSchema.safeParse(body)
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())

    const { deliveryDate, ...rest } = parsed.data
    const data = {
      ...rest,
      ...(deliveryDate !== undefined && { deliveryDate: deliveryDate ? new Date(deliveryDate) : null }),
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: { customer: true, items: true, payments: true },
    })

    return NextResponse.json(order)
  } catch (error: unknown) {
    console.error('Error updating order:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025')
      return notFound('Order not found')
    return internalError('Failed to update order')
  }
}
