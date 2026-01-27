import { NextRequest, NextResponse } from 'next/server'
import { processFollowUps } from '@/lib/cron/follow-up-processor'

/**
 * Vercel cron endpoint for follow-up automation
 * Can be called by Vercel cron or manually
 * 
 * To set up Vercel cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/follow-ups",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Optional: Add authentication check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await processFollowUps()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error) {
    console.error('Error processing follow-ups:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
