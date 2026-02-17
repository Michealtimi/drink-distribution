import { NextRequest, NextResponse } from 'next/server'
import { ScraperManager } from '@/lib/scrapers/scraper-manager'
import { timeout, internalError } from '@/lib/api-errors'

const HISTORY_TIMEOUT_MS = 18_000

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const manager = new ScraperManager()
    const historyPromise = manager.getJobHistory(limit)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), HISTORY_TIMEOUT_MS)
    )

    const history = await Promise.race([historyPromise, timeoutPromise])
    return NextResponse.json(history)
  } catch (error) {
    const isTimeout = error instanceof Error && error.message === 'TIMEOUT'
    if (isTimeout) {
      console.error('[ScrapersHistory] Timeout after', HISTORY_TIMEOUT_MS, 'ms')
      return timeout('Database took too long to respond. Check DATABASE_URL and that the database is reachable.')
    }
    console.error('[ScrapersHistory] Error:', error instanceof Error ? error.message : error)
    return internalError('Failed to fetch scraping history. Check database connection.')
  }
}
