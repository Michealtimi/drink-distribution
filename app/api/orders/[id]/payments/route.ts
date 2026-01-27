import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { amount, paymentMethod, reference, notes, paymentDate } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get order to check total
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        payments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        orderId: params.id,
        amount,
        paymentMethod: paymentMethod || null,
        reference: reference || null,
        notes: notes || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      },
    })

    // Calculate total paid
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0) + amount

    // Update order payment status
    let newPaymentStatus = PaymentStatus.PENDING
    if (totalPaid >= order.totalAmount) {
      newPaymentStatus = PaymentStatus.PAID
    } else if (totalPaid > 0) {
      newPaymentStatus = PaymentStatus.PENDING // Partial payment
    }

    await prisma.order.update({
      where: { id: params.id },
      data: {
        paymentStatus: newPaymentStatus,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
