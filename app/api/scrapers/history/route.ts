import { NextRequest, NextResponse } from 'next/server'
import { ScraperManager } from '@/lib/scrapers/scraper-manager'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const manager = new ScraperManager()
    const history = await manager.getJobHistory(limit)

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching scraping history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scraping history' },
      { status: 500 }
    )
  }
}
