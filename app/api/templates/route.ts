import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CustomerType, City } from '@prisma/client'
import { badRequest, internalError } from '@/lib/api-errors'
import { createTemplateSchema, parseListLimit } from '@/lib/validations/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const category = searchParams.get('category') as CustomerType | null
    const city = searchParams.get('city') as City | null
    const stage = searchParams.get('stage')
    const isActive = searchParams.get('isActive')
    const take = parseListLimit(searchParams)

    const templates = await prisma.messageTemplate.findMany({
      where: {
        ...(type && { type }),
        ...(category && { category }),
        ...(city && { city }),
        ...(stage && { stage }),
        ...(isActive !== null && isActive !== undefined && { isActive: isActive === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
      take,
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return internalError('Failed to fetch templates')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createTemplateSchema.safeParse(body)
    if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())

    const template = await prisma.messageTemplate.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        category: parsed.data.category ?? null,
        city: parsed.data.city ?? null,
        stage: parsed.data.stage,
        content: parsed.data.content,
        variables: parsed.data.variables,
        isActive: parsed.data.isActive,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return internalError('Failed to create template')
  }
}
