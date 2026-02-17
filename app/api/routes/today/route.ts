import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * GET /api/routes/today?dayOfWeek=Monday
 * Returns routes for the given day (default: current day) with customers in sequence.
 * Used for "Today's route" print/export.
 */
export async function GET(request: NextRequest) {
  try {
    const dayOfWeek = request.nextUrl.searchParams.get('dayOfWeek')?.trim()
    const day = dayOfWeek && DAYS.includes(dayOfWeek)
      ? dayOfWeek
      : DAYS[new Date().getDay()]

    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
        dayOfWeek: day,
      },
      include: {
        customers: {
          orderBy: { sequence: 'asc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                area: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      dayOfWeek: day,
      routes: routes.map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        area: r.area,
        dayOfWeek: r.dayOfWeek,
        customers: r.customers.map((rc) => ({
          sequence: rc.sequence,
          ...rc.customer,
        })),
      })),
    })
  } catch (error) {
    console.error('Error fetching today routes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s routes' },
      { status: 500 }
    )
  }
}
