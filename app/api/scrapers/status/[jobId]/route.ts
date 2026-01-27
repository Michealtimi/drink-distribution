import { NextRequest, NextResponse } from 'next/server'
import { ScraperManager } from '@/lib/scrapers/scraper-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const manager = new ScraperManager()
    const job = await manager.getJobStatus(params.jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}
