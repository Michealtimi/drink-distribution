import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getJobScrapedLeads } from '@/lib/scrapers/job-scraped-store'
import { importFromScrape } from '@/lib/lead-import-service'
import type { ScrapedLead } from '@/lib/scrapers/base-scraper'
import { City, CustomerType, ScraperType } from '@prisma/client'

const SOURCE_NAMES: Record<ScraperType, string> = {
  [ScraperType.GOOGLE_MAPS]: 'Google Maps',
  [ScraperType.INSTAGRAM]: 'Instagram',
  [ScraperType.DIRECTORY]: 'Business Directory',
  [ScraperType.FINELIB]: 'Finelib',
  [ScraperType.FACEBOOK]: 'Facebook',
  [ScraperType.BUSINESSLIST]: 'Business List',
}

/**
 * POST /api/scrapers/[jobId]/import-leads
 * Import the job's scraped results into Leads (for cancelled or completed jobs that have 0 imported).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const job = await prisma.scrapingJob.findUnique({
      where: { id: jobId },
      select: { type: true, city: true, status: true, leadsFound: true, leadsImported: true, scrapedResults: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'COMPLETED' && job.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Only completed or cancelled jobs can import leads' },
        { status: 400 }
      )
    }

    let rows: Array<{ name: string; phone: string; address?: string; area?: string; city: string; category: string }> = []
    const fromMemory = getJobScrapedLeads(jobId)
    if (fromMemory.length > 0) {
      rows = fromMemory
    } else if (Array.isArray(job.scrapedResults) && job.scrapedResults.length > 0) {
      rows = job.scrapedResults as typeof rows
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No scraped results to import', imported: 0, duplicates: 0 },
        { status: 400 }
      )
    }

    const scrapedLeads: ScrapedLead[] = rows.map((r) => ({
      name: r.name,
      phone: r.phone || '',
      address: r.address,
      area: r.area,
      city: r.city as City,
      category: r.category as CustomerType,
    }))

    const sourceName = SOURCE_NAMES[job.type as ScraperType] ?? 'Unknown'
    const result = await importFromScrape(scrapedLeads, sourceName, {
      city: job.city ?? undefined,
      onlyWhatsAppChecked: false,
    })

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        leadsImported: result.imported,
        duplicates: result.duplicates,
        errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
      },
    })

    return NextResponse.json({
      success: true,
      imported: result.imported,
      duplicates: result.duplicates,
      errors: result.errors,
      message: `Imported ${result.imported} leads, ${result.duplicates} duplicates skipped`,
    })
  } catch (error) {
    console.error('Error importing leads:', error)
    return NextResponse.json(
      { error: 'Failed to import leads', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
