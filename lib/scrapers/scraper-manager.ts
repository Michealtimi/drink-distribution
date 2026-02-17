import { prisma } from '../prisma'
import { ScrapingJobStatus, ScraperType, City, CustomerType } from '@prisma/client'
import { logger } from '../logger'
import { GoogleMapsScraper } from './google-maps-scraper'
import { InstagramScraper } from './instagram-scraper'
import { DirectoryScraper } from './directory-scraper'
import { FinelibScraper } from './finelib-scraper'
import { BaseScraper, ScrapedLead } from './base-scraper'
import { importFromScrape } from '../lead-import-service'
import { checkNumberRegistered } from '../whatsapp-send'
import { validatePhone } from '../phone-utils'
import { appendJobScrapedLeads, clearJobScrapedLeads, setJobScrapedLeads } from './job-scraped-store'

const MAX_WHATSAPP_CHECKS_PER_JOB = 40
const WHATSAPP_CHECK_DELAY_MS = 2000
/** Max time per search query (2 minutes). Job continues with next query on timeout. */
const SCRAPE_QUERY_TIMEOUT_MS = 2 * 60 * 1000

/** Set to true after first failed persist of scrapedResults (e.g. Prisma client out of date). Stops log spam. */
let scrapedResultsPersistDisabled = false

export interface ScrapingJobInput {
  type: ScraperType
  query: string | string[]
  city?: City
  category?: CustomerType
  area?: string
  maxResults?: number
  checkWhatsAppBeforeImport?: boolean
}

export class ScraperManager {
  private getScraper(type: ScraperType, city?: City, category?: CustomerType, maxResults?: number): BaseScraper {
    const config = { city, category, maxResults }
    
    switch (type) {
      case ScraperType.GOOGLE_MAPS:
        return new GoogleMapsScraper(config)
      case ScraperType.INSTAGRAM:
        return new InstagramScraper(config)
      case ScraperType.DIRECTORY:
        return new DirectoryScraper(config)
      case ScraperType.FINELIB:
        return new FinelibScraper(config)
      case ScraperType.FACEBOOK:
        // Facebook scraper can reuse Instagram scraper logic
        return new InstagramScraper(config)
      default:
        throw new Error(`Unknown scraper type: ${type}`)
    }
  }

  async runScrapingJob(input: ScrapingJobInput): Promise<string> {
    // Create job record
    const queryString = Array.isArray(input.query) ? input.query.join(', ') : input.query
    const job = await prisma.scrapingJob.create({
      data: {
        type: input.type,
        status: ScrapingJobStatus.PENDING,
        query: queryString,
        city: input.city || null,
        category: input.category || null,
      },
    })

    const log = logger.child({ jobId: job.id })
    log.info('Scraping job created', { type: input.type, query: queryString })
    // Run scraping asynchronously
    this.executeScrapingJob(job.id, input).catch((error) => {
      logger.error('Scraping job failed', { jobId: job.id, error: error instanceof Error ? error.message : String(error) })
    })

    return job.id
  }

  private async executeScrapingJob(jobId: string, input: ScrapingJobInput): Promise<void> {
    const log = logger.child({ jobId })
    try {
      if (await this.isJobCancelled(jobId)) return

      const queryString = Array.isArray(input.query) ? input.query.join(', ') : input.query
      log.info('Scraping job started', { type: input.type, query: queryString })
      // Update job status to running; clear live results for this job so UI shows fresh data
      clearJobScrapedLeads(jobId)
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: ScrapingJobStatus.RUNNING,
          startedAt: new Date(),
        },
      })
      await this.persistScrapedResults(jobId, []).catch(() => {})

      // Get scraper instance (search range = maxResults per query)
      const scraper = this.getScraper(input.type, input.city, input.category, input.maxResults)

      // Handle multiple queries
      const queries = Array.isArray(input.query) ? input.query : [input.query]
      let allScrapedLeads: ScrapedLead[] = []

      for (const query of queries) {
        if (await this.isJobCancelled(jobId)) {
          console.log(`[ScraperManager] Job ${jobId} cancelled, stopping. Leads scraped so far: ${allScrapedLeads.length}`)
          const snapshot = allScrapedLeads.map((l) => ({ name: l.name, phone: l.phone, address: l.address, area: l.area, city: l.city, category: l.category }))
          setJobScrapedLeads(jobId, snapshot)
          await this.persistScrapedResults(jobId, snapshot)
          await this.finishCancelledJob(jobId, allScrapedLeads.length)
          if ('close' in scraper && typeof scraper.close === 'function') await scraper.close()
          return
        }
        console.log(`[ScraperManager] ========================================`)
        console.log(`[ScraperManager] Starting scrape for query: "${query}"`)
        console.log(`[ScraperManager] Scraper type: ${input.type}`)
        console.log(`[ScraperManager] City: ${input.city || 'Not specified'}`)
        console.log(`[ScraperManager] ========================================`)
        
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Query timed out after ${SCRAPE_QUERY_TIMEOUT_MS / 1000}s`)), SCRAPE_QUERY_TIMEOUT_MS)
          )
          const scrapedLeads = await Promise.race([scraper.scrape(query.trim()), timeoutPromise])
          console.log(`[ScraperManager] ✓ Query "${query}" completed: ${scrapedLeads.length} leads found`)
          allScrapedLeads = [...allScrapedLeads, ...scrapedLeads]
          const batch = scrapedLeads.map((l) => ({ name: l.name, phone: l.phone, address: l.address, area: l.area, city: l.city, category: l.category }))
          appendJobScrapedLeads(jobId, batch)
          await this.persistScrapedResults(jobId, allScrapedLeads.map((l) => ({ name: l.name, phone: l.phone, address: l.address, area: l.area, city: l.city, category: l.category })))
        } catch (queryError) {
          const errorMsg = queryError instanceof Error ? queryError.message : String(queryError)
          console.error(`[ScraperManager] ✗ Query "${query}" failed:`, errorMsg)
          // Continue with next query instead of failing entire job
        }
      }

      if (await this.isJobCancelled(jobId)) {
        const snapshot = allScrapedLeads.map((l) => ({ name: l.name, phone: l.phone, address: l.address, area: l.area, city: l.city, category: l.category }))
        setJobScrapedLeads(jobId, snapshot)
        await this.persistScrapedResults(jobId, snapshot)
        await this.finishCancelledJob(jobId, allScrapedLeads.length)
        if ('close' in scraper && typeof scraper.close === 'function') await scraper.close()
        return
      }

      const fullSnapshot = allScrapedLeads.map((l) => ({ name: l.name, phone: l.phone, address: l.address, area: l.area, city: l.city, category: l.category }))
      setJobScrapedLeads(jobId, fullSnapshot)
      await this.persistScrapedResults(jobId, fullSnapshot)
      console.log(`[ScraperManager] ========================================`)
      console.log(`[ScraperManager] Scraping Summary: total scraped=${allScrapedLeads.length}, queries=${queries.length}`)
      console.log(`[ScraperManager] ========================================`)

      let leadsToImport = allScrapedLeads
      if (input.checkWhatsAppBeforeImport && allScrapedLeads.length > 0) {
        const withPhone = allScrapedLeads.filter((l) => l.phone && l.phone.trim() && validatePhone(l.phone))
        console.log(`[ScraperManager] WhatsApp check: ${withPhone.length} leads with valid phone (max ${MAX_WHATSAPP_CHECKS_PER_JOB} checks)`)
        const withWhatsApp: ScrapedLead[] = []
        let checks = 0
        for (const lead of withPhone) {
          if (checks >= MAX_WHATSAPP_CHECKS_PER_JOB) break
          try {
            const onWhatsApp = await checkNumberRegistered(lead.phone)
            if (onWhatsApp) withWhatsApp.push(lead)
            checks++
            await new Promise((r) => setTimeout(r, WHATSAPP_CHECK_DELAY_MS))
          } catch {
            // Skip this lead if check fails
          }
        }
        leadsToImport = withWhatsApp
        console.log(`[ScraperManager] After WhatsApp check: ${leadsToImport.length} leads with WhatsApp (checked ${checks})`)
      }

      const sourceName = this.getSourceName(input.type)
      const importResult = await importFromScrape(leadsToImport, sourceName, {
        city: input.city ?? undefined,
        onlyWhatsAppChecked: input.checkWhatsAppBeforeImport ?? false,
      })
      console.log(
        `[ScraperManager] After import: ${importResult.imported} imported, ${importResult.duplicates} duplicates`
      )

      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: ScrapingJobStatus.COMPLETED,
          completedAt: new Date(),
          leadsFound: allScrapedLeads.length,
          leadsImported: importResult.imported,
          duplicates: importResult.duplicates,
          errors: importResult.errors.length > 0 ? JSON.stringify(importResult.errors) : null,
        },
      })

      log.info('Scraping job completed', { leadsFound: allScrapedLeads.length, imported: importResult.imported, duplicates: importResult.duplicates })
      // Cleanup scraper resources
      if ('close' in scraper && typeof scraper.close === 'function') {
        await scraper.close()
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error('Scraping job error', { jobId, error: errorMsg })
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: ScrapingJobStatus.FAILED,
          completedAt: new Date(),
          errors: JSON.stringify([errorMsg]),
        },
      })
    }
  }

  /** Persist current scraped results to DB so the UI can show them (works across processes). No-op if DB/client does not have scrapedResults yet. */
  private async persistScrapedResults(
    jobId: string,
    results: { name: string; phone: string; address?: string; area?: string; city: string; category: string }[],
  ): Promise<void> {
    if (scrapedResultsPersistDisabled) return
    try {
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: { scrapedResults: results } as { scrapedResults: typeof results },
      })
    } catch (e) {
      scrapedResultsPersistDisabled = true
      // Prisma client or DB may not have scrapedResults. Run: pnpm db:push && pnpm prisma generate (see SETUP.md)
      logger.warn('scrapedResults persist disabled for this process (in-memory store still used)', {
        jobId,
        hint: 'Run: pnpm db:push && pnpm prisma generate',
      })
    }
  }

  private async finishCancelledJob(jobId: string, leadsFoundSoFar: number): Promise<void> {
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: ScrapingJobStatus.CANCELLED,
        completedAt: new Date(),
        leadsFound: leadsFoundSoFar,
      },
    })
  }

  private getSourceName(type: ScraperType): string {
    switch (type) {
      case ScraperType.GOOGLE_MAPS:
        return 'Google Maps'
      case ScraperType.INSTAGRAM:
        return 'Instagram'
      case ScraperType.DIRECTORY:
        return 'Business Directory'
      case ScraperType.FINELIB:
        return 'Finelib'
      case ScraperType.FACEBOOK:
        return 'Facebook'
      default:
        return 'Unknown'
    }
  }

  async getJobStatus(jobId: string) {
    return await prisma.scrapingJob.findUnique({
      where: { id: jobId },
    })
  }

  /** Cancel a job if it is PENDING or RUNNING. Returns true if cancelled. */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await prisma.scrapingJob.findUnique({ where: { id: jobId } })
    if (!job || (job.status !== ScrapingJobStatus.PENDING && job.status !== ScrapingJobStatus.RUNNING)) {
      return false
    }
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: ScrapingJobStatus.CANCELLED,
        completedAt: new Date(),
      },
    })
    return true
  }

  private async isJobCancelled(jobId: string): Promise<boolean> {
    const job = await prisma.scrapingJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    })
    return job?.status === ScrapingJobStatus.CANCELLED
  }

  async getJobHistory(limit: number = 50) {
    return await prisma.scrapingJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
