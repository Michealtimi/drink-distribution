import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serviceUnavailable, internalError } from '@/lib/api-errors'

export async function GET() {
  try {
    // Get all metrics in parallel
    const [
      totalLeads,
      leadsByStatus,
      totalCustomers,
      totalOrders,
      totalRevenue,
      pendingPayments,
      paidPayments,
      followUpsPending,
      followUpsOverdue,
      leadsBySource,
      ordersByMonth,
      revenueByCity,
    ] = await Promise.all([
      // Total leads
      prisma.lead.count(),

      // Leads by status
      prisma.lead.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Total customers
      prisma.customer.count(),

      // Total orders
      prisma.order.count(),

      // Total revenue (sum of all paid payments)
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
      }),

      // Pending payments
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PENDING',
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Paid payments
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
      }),

      // Pending follow-ups
      prisma.followUp.count({
        where: {
          completed: false,
          scheduledFor: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // Overdue follow-ups
      prisma.followUp.count({
        where: {
          completed: false,
          scheduledFor: {
            lt: new Date(),
          },
        },
      }),

      // Leads by source
      prisma.lead.groupBy({
        by: ['source'],
        _count: true,
        where: {
          source: {
            not: null,
          },
        },
      }),

      // Orders by month (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count,
          COALESCE(SUM("totalAmount"), 0)::float as revenue
        FROM "Order"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,

      // Revenue by city (aggregated in DB — no unbounded findMany)
      prisma.$queryRaw<Array<{ city: string; revenue: number }>>`
        SELECT c.city, COALESCE(SUM(p.amount), 0)::float as revenue
        FROM "Payment" p
        JOIN "Order" o ON o.id = p."orderId"
        JOIN "Customer" c ON c.id = o."customerId"
        GROUP BY c.city
      `,
    ])

    // Calculate conversion rate
    const customerLeads = leadsByStatus.find((s: typeof leadsByStatus[number]) => s.status === 'CUSTOMER' || s.status === 'REPEAT_CUSTOMER')
    const conversionRate = totalLeads > 0 
      ? ((customerLeads?._count || 0) / totalLeads) * 100 
      : 0

    // Process orders by month
    const ordersByMonthProcessed = (ordersByMonth as Array<{ month: Date; count: number; revenue: number }>).map(
      (row) => ({
        month: row.month.toISOString().substring(0, 7),
        count: Number(row.count),
        revenue: Number(row.revenue ?? 0),
      })
    )

    // Revenue by city is already aggregated from DB
    const revenueByCityProcessed: Record<string, number> = {}
    for (const row of revenueByCity) {
      revenueByCityProcessed[row.city] = Number(row.revenue ?? 0)
    }

    return NextResponse.json({
      overview: {
        totalLeads,
        totalCustomers,
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      leads: {
        byStatus: leadsByStatus.map(s => ({
          status: s.status,
          count: s._count,
        })),
        bySource: leadsBySource.map(s => ({
          source: s.source || 'Unknown',
          count: s._count,
        })),
      },
      payments: {
        pending: pendingPayments._sum.totalAmount || 0,
        paid: paidPayments._sum.amount || 0,
      },
      followUps: {
        pending: followUpsPending,
        overdue: followUpsOverdue,
      },
      charts: {
        ordersByMonth: ordersByMonthProcessed,
        revenueByCity: Object.entries(revenueByCityProcessed).map(([city, revenue]) => ({
          city,
          revenue,
        })),
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching analytics:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    if (
      err.name === 'PrismaClientInitializationError' ||
      err.message?.includes("Can't reach database server")
    ) {
      return serviceUnavailable(
        'Database connection failed',
        'Unable to connect to the database. Please check your database connection settings.',
        process.env.NODE_ENV === 'development' ? err.message : undefined
      )
    }
    return internalError('Failed to fetch analytics', err.message)
  }
}
