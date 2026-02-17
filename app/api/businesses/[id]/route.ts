import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound, badRequest, internalError } from '@/lib/api-errors'
import { updateBusinessSchema } from '@/lib/validations/api-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: params.id },
      include: {
        leads: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        customers: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!business) return notFound('Business not found')
    return NextResponse.json(business)
  } catch (error) {
    console.error('Error fetching business:', error)
    return internalError('Failed to fetch business')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsed = updateBusinessSchema.safeParse(body)
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())

    const business = await prisma.business.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name != null && { name: parsed.data.name }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone ?? null }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email ?? null }),
        ...(parsed.data.address !== undefined && { address: parsed.data.address ?? null }),
        ...(parsed.data.area !== undefined && { area: parsed.data.area ?? null }),
        ...(parsed.data.city != null && { city: parsed.data.city }),
        ...(parsed.data.category != null && { category: parsed.data.category }),
        ...(parsed.data.website !== undefined && { website: parsed.data.website ?? null }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes ?? null }),
      },
    })

    return NextResponse.json(business)
  } catch (error: unknown) {
    console.error('Error updating business:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025')
      return notFound('Business not found')
    return internalError('Failed to update business')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.business.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting business:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025')
      return notFound('Business not found')
    return internalError('Failed to delete business')
  }
}
