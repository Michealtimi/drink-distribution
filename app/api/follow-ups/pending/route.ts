import { NextResponse } from 'next/server'
import { getPendingFollowUpsForToday, getOverdueFollowUps } from '@/lib/follow-up-scheduler'

export async function GET() {
  try {
    const [pending, overdue] = await Promise.all([
      getPendingFollowUpsForToday(),
      getOverdueFollowUps(),
    ])

    return NextResponse.json({
      pending,
      overdue,
    })
  } catch (error) {
    console.error('Error fetching pending follow-ups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending follow-ups' },
      { status: 500 }
    )
  }
}
