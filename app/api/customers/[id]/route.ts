import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound, internalError } from '@/lib/api-errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: true, payments: true },
        },
      },
    })

    if (!customer) return notFound('Customer not found')
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return internalError('Failed to fetch customer')
  }
}
