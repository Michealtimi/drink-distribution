import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { badRequest, internalError } from '@/lib/api-errors'
import { createOrderSchema, parseListLimit } from '@/lib/validations/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const take = parseListLimit(request.nextUrl.searchParams)
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return internalError('Failed to fetch orders')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())

    const { customerId, items, notes } = parsed.data
    // Atomic order number: timestamp + random avoids collisions under concurrent POSTs (see SPRINT_PLAN.md)
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const order = await prisma.order.create({
      data: {
        customerId,
        orderNumber,
        totalAmount,
        notes: notes ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId ?? null,
            productName: item.productName ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: true, customer: true },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return internalError('Failed to create order')
  }
}
