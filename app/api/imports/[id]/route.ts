import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const importBatch = await prisma.importBatch.findUnique({
      where: { id: params.id },
    })

    if (!importBatch) {
      return NextResponse.json(
        { error: 'Import batch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(importBatch)
  } catch (error) {
    console.error('Error fetching import batch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import batch' },
      { status: 500 }
    )
  }
}
