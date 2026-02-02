import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCSV } from '@/lib/csv-parser'
import { City, CustomerType, LeadStatus } from '@prisma/client'
import { batchImportLeadRecords } from '@/lib/lead-import-pipeline'
import { internalError } from '@/lib/api-errors'

const categoryMap: Record<string, CustomerType> = {
  DISTRIBUTOR: CustomerType.DISTRIBUTOR,
  SUPPLIER: CustomerType.SUPPLIER,
  CONSUMER: CustomerType.CONSUMER,
  GYM: CustomerType.GYM,
  EVENT_CENTER: CustomerType.EVENT_CENTER,
  EVENTCENTER: CustomerType.EVENT_CENTER,
  CLUB: CustomerType.CLUB,
  LOUNGE: CustomerType.LOUNGE,
  OFFICE: CustomerType.OFFICE,
  SMALL_RETAILER: CustomerType.SMALL_RETAILER,
  RETAILER: CustomerType.SMALL_RETAILER,
  OTHER: CustomerType.OTHER,
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in CSV', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const phones = [...new Set(rows.map((r) => r.phone).filter(Boolean))]
    const existingLeads = await prisma.lead.findMany({
      where: { phone: { in: phones } },
      select: { phone: true, email: true },
    })
    const existingPhones = new Set(existingLeads.map((l) => l.phone).filter(Boolean))
    const existingEmails = new Set(existingLeads.map((l) => l.email).filter(Boolean) as string[])

    const records = rows.map((row) => {
      const category = categoryMap[row.category] || CustomerType.OTHER
      const city = row.city === 'LAGOS' ? City.LAGOS : City.ABUJA
      return {
        name: row.name,
        phone: row.phone,
        email: row.email ?? null,
        address: row.address ?? null,
        area: row.area ?? null,
        city,
        category,
        source: 'CSV Import',
        status: LeadStatus.SCRAPED as LeadStatus,
      }
    })

    const { imported, skipped, errors: importErrors } = await batchImportLeadRecords(
      records,
      existingPhones,
      existingEmails
    )
    const duplicates = skipped
    const errors = importErrors.length

    const importBatch = await prisma.importBatch.create({
      data: {
        fileName: file.name,
        source: 'CSV',
        totalRows: rows.length,
        imported,
        duplicates,
        errors,
        errorDetails: importErrors.length > 0 ? JSON.stringify(importErrors) : null,
      },
    })

    return NextResponse.json({
      success: true,
      importBatchId: importBatch.id,
      imported,
      duplicates,
      errors,
      errorDetails: importErrors.slice(0, 10),
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return internalError('Failed to import CSV')
  }
}
