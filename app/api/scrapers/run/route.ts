import { NextRequest, NextResponse } from 'next/server'
import { ScraperManager } from '@/lib/scrapers/scraper-manager'
import { ScraperType, City, CustomerType } from '@prisma/client'
import { getAreasForCity } from '@/lib/constants/areas'
import { scraperRunSchema } from '@/lib/validations/api-schemas'
import { badRequest, internalError } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = scraperRunSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
        ? Object.entries(parsed.error.flatten().fieldErrors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join('; ')
        : parsed.error.errors.map((e) => e.message).join('; ')
      return badRequest(msg || 'Validation failed', parsed.error.flatten())
    }

    const { type, types, query, queries, city, category, area, runAllAreas, maxResults, checkWhatsAppBeforeImport } = parsed.data

    const typesArray = types && types.length > 0 ? types : (type ? [type] : [])

    let queryValue: string | string[]
    if (queries != null) {
      const q = Array.isArray(queries)
        ? queries.filter((s) => String(s).trim() !== '')
        : String(queries).split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
      queryValue = q.length === 1 ? q[0] : q
    } else if (query != null && String(query).trim()) {
      queryValue = String(query).trim()
    } else {
      return badRequest('Missing required field: query (or queries array)')
    }

    const baseQueries = Array.isArray(queryValue) ? queryValue : [queryValue]

    if (runAllAreas && baseQueries.length > 0) {
      const areas = getAreasForCity(city || '')
      const expanded = baseQueries.flatMap((q: string) => {
        const trimmed = q.trim()
        return [trimmed, ...areas.map((a) => `${trimmed} ${a}`)]
      })
      queryValue = [...new Set(expanded)]
    } else {
      queryValue = baseQueries.length === 1 ? baseQueries[0] : baseQueries
    }

    if (Array.isArray(queryValue) && queryValue.length === 0) {
      return badRequest('Missing required field: query (or queries array)')
    }

    const manager = new ScraperManager()
    const jobIds: string[] = []

    // Create a separate job for each scraper type
    for (const scraperType of typesArray) {
      const jobId = await manager.runScrapingJob({
        type: scraperType as ScraperType,
        query: queryValue,
        city: city ? (city as City) : undefined,
        category: category ? (category as CustomerType) : undefined,
        area: area || undefined,
        maxResults: maxResults ?? undefined,
        checkWhatsAppBeforeImport: checkWhatsAppBeforeImport ?? undefined,
      })
      jobIds.push(jobId)
    }

    return NextResponse.json({
      success: true,
      jobIds,
      jobId: jobIds[0], // Return first job ID for backward compatibility
      message: `Started ${jobIds.length} scraping job(s)`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[ScrapersRun] Error starting job:', message)
    const isEnumError = /invalid input value for enum "CustomerType"/i.test(message)
    if (isEnumError) {
      return NextResponse.json(
        {
          error: 'Database enum out of date. Add missing CustomerType values (DISTRIBUTOR, SUPPLIER, CONSUMER).',
          details: 'Run: pnpm db:push  OR  apply prisma/migrations/20250202120000_add_customer_type_enum_values/migration.sql to your database.',
        },
        { status: 500 }
      )
    }
    return internalError('Failed to start scraping job', message)
  }
}
