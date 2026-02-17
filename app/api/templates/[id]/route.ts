import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound, badRequest, internalError } from '@/lib/api-errors'
import { updateTemplateSchema } from '@/lib/validations/api-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) return notFound('Template not found')
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return internalError('Failed to fetch template')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsed = updateTemplateSchema.safeParse(body)
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())

    const template = await prisma.messageTemplate.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name != null && { name: parsed.data.name }),
        ...(parsed.data.type != null && { type: parsed.data.type }),
        ...(parsed.data.category !== undefined && { category: parsed.data.category ?? null }),
        ...(parsed.data.city !== undefined && { city: parsed.data.city ?? null }),
        ...(parsed.data.stage != null && { stage: parsed.data.stage }),
        ...(parsed.data.content != null && { content: parsed.data.content }),
        ...(parsed.data.variables !== undefined && { variables: parsed.data.variables }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
    })

    return NextResponse.json(template)
  } catch (error: unknown) {
    console.error('Error updating template:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025')
      return notFound('Template not found')
    return internalError('Failed to update template')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.messageTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error deleting template:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025')
      return notFound('Template not found')
    return internalError('Failed to delete template')
  }
}
