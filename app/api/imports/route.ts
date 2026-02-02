import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    const imports = await prisma.importBatch.findMany({
      take: limit,
      orderBy: {
        importedAt: 'desc',
      },
    })

    return NextResponse.json(imports)
  } catch (error) {
    console.error('Error fetching imports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch imports' },
      { status: 500 }
    )
  }
}
