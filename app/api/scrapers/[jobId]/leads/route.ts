import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ScraperType } from '@prisma/client'

function sourceNameForType(type: ScraperType): string {
  switch (type) {
    case ScraperType.GOOGLE_MAPS:
      return 'Google Maps'
    case ScraperType.INSTAGRAM:
      return 'Instagram'
    case ScraperType.DIRECTORY:
      return 'Business Directory'
    case ScraperType.BUSINESSLIST:
      return 'BusinessList Nigeria'
    case ScraperType.FINELIB:
      return 'Finelib'
    case ScraperType.FACEBOOK:
      return 'Facebook'
    default:
      return 'Unknown'
  }
}

/**
 * GET /api/scrapers/[jobId]/leads
 * Returns leads that were imported by this scraping job.
 * Matches by source name and createdAt window (job.createdAt .. job.completedAt + 2 min).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId
    const job = await prisma.scrapingJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const source = sourceNameForType(job.type)
    const from = job.createdAt
    const to = new Date(job.completedAt ? job.completedAt.getTime() + 2 * 60 * 1000 : Date.now())

    const leads = await prisma.lead.findMany({
      where: {
        source,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        category: true,
        status: true,
        area: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error fetching job leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
