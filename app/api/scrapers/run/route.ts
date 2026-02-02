import { NextRequest, NextResponse } from 'next/server'
import { ScraperManager } from '@/lib/scrapers/scraper-manager'
import { ScraperType, City, CustomerType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, types, query, queries, city, category, area } = body

    // Support both single type (backward compatibility) and multiple types
    const typesArray = types && Array.isArray(types) && types.length > 0
      ? types
      : (type ? [type] : [])

    if (typesArray.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: type or types array' },
        { status: 400 }
      )
    }

    // Support single query (string), multiple queries (array), or queries as comma/newline string
    let queryValue: string | string[]
    if (queries && Array.isArray(queries) && queries.length > 0) {
      queryValue = queries.filter((q: string) => q != null && String(q).trim() !== '')
    } else if (typeof queries === 'string' && queries.trim()) {
      queryValue = queries.split(/[\n,]/).map((q) => q.trim()).filter(Boolean)
    } else if (query != null && String(query).trim()) {
      queryValue = String(query).trim()
    } else {
      queryValue = []
    }

    if (!queryValue || (Array.isArray(queryValue) && queryValue.length === 0)) {
      return NextResponse.json(
        { error: 'Missing required field: query (or queries array)' },
        { status: 400 }
      )
    }

    // Validate all scraper types
    for (const t of typesArray) {
      if (!Object.values(ScraperType).includes(t)) {
        return NextResponse.json(
          { error: `Invalid scraper type: ${t}. Must be one of: ${Object.values(ScraperType).join(', ')}` },
          { status: 400 }
        )
      }
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
      })
      jobIds.push(jobId)
    }

    return NextResponse.json({
      success: true,
      jobIds,
      jobId: jobIds[0], // Return first job ID for backward compatibility
      message: `Started ${jobIds.length} scraping job(s)`,
    })
  } catch (error) {
    console.error('Error starting scraping job:', error)
    return NextResponse.json(
      { error: 'Failed to start scraping job', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
