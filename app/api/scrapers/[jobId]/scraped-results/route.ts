import { NextRequest, NextResponse } from 'next/server'
import { getJobScrapedLeads } from '@/lib/scrapers/job-scraped-store'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/scrapers/[jobId]/scraped-results
 * Returns leads found by this job. Uses in-memory store first (live during job);
 * if empty, falls back to DB (scrapedResults) so results survive server restart.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }
    const fromMemory = getJobScrapedLeads(jobId)
    if (fromMemory.length > 0) {
      return NextResponse.json(fromMemory)
    }
    // Fallback: DB (works after pnpm db:push && pnpm prisma generate)
    try {
      const job = await prisma.scrapingJob.findUnique({
        where: { id: jobId },
        select: { scrapedResults: true },
      })
      const fromDb = job?.scrapedResults
      if (Array.isArray(fromDb) && fromDb.length > 0) {
        return NextResponse.json(fromDb)
      }
    } catch {
      // DB may not have scrapedResults column yet
    }
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching scraped results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scraped results' },
      { status: 500 }
    )
  }
}
