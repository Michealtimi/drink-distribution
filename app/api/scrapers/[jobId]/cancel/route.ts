import { NextRequest, NextResponse } from 'next/server'
import { ScraperManager } from '@/lib/scrapers/scraper-manager'

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }
    const manager = new ScraperManager()
    const cancelled = await manager.cancelJob(jobId)
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Job not found or already finished' },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: true, message: 'Job cancelled' })
  } catch (error) {
    console.error('Error cancelling job:', error)
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    )
  }
}
