import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CustomerType, City } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const category = searchParams.get('category') as CustomerType | null
    const city = searchParams.get('city') as City | null
    const stage = searchParams.get('stage')
    const isActive = searchParams.get('isActive')

    const templates = await prisma.messageTemplate.findMany({
      where: {
        ...(type && { type }),
        ...(category && { category }),
        ...(city && { city }),
        ...(stage && { stage }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, category, city, stage, content, variables, isActive } = body

    if (!name || !type || !stage || !content) {
      return NextResponse.json(
        { error: 'Name, type, stage, and content are required' },
        { status: 400 }
      )
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name,
        type,
        category: category || null,
        city: city || null,
        stage,
        content,
        variables: variables || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
