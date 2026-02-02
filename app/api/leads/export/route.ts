import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus, City, CustomerType } from '@prisma/client'

const EXPORT_LIMIT = 5000

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as LeadStatus | null
    const city = searchParams.get('city') as City | null
    const category = searchParams.get('category') as CustomerType | null
    const format = searchParams.get('format') || 'csv'

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Only format=csv is supported' }, { status: 400 })
    }

    const where = {
      ...(status && Object.values(LeadStatus).includes(status) && { status }),
      ...(city && Object.values(City).includes(city) && { city }),
      ...(category && Object.values(CustomerType).includes(category) && { category }),
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: EXPORT_LIMIT,
    })

    const header =
      'name,phone,email,address,area,city,category,status,source,hasWhatsApp,notes,createdAt'
    const rows = leads.map(
      (l) =>
        [
          escapeCsvField(l.name),
          escapeCsvField(l.phone),
          escapeCsvField(l.email),
          escapeCsvField(l.address),
          escapeCsvField(l.area),
          escapeCsvField(l.city),
          escapeCsvField(l.category),
          escapeCsvField(l.status),
          escapeCsvField(l.source),
          l.hasWhatsApp ? 'true' : 'false',
          escapeCsvField(l.notes),
          l.createdAt.toISOString(),
        ].join(',')
    )
    const csv = [header, ...rows].join('\r\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting leads:', error)
    return NextResponse.json(
      { error: 'Failed to export leads', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
