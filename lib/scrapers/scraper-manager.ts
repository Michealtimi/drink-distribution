import { prisma } from '../prisma'
import { ScrapingJobStatus, ScraperType, City, CustomerType } from '@prisma/client'
import { GoogleMapsScraper } from './google-maps-scraper'
import { InstagramScraper } from './instagram-scraper'
import { DirectoryScraper } from './directory-scraper'
import { BusinessListScraper } from './businesslist-scraper'
import { FinelibScraper } from './finelib-scraper'
import { BaseScraper, ScrapedLead } from './base-scraper'
import { deduplicateLeads } from '../lead-deduplicator'
import { LeadStatus } from '@prisma/client'
import { autoValidateScrapedLeads } from '../lead-validator'

export interface ScrapingJobInput {
  type: ScraperType
  query: string | string[]
  city?: City
  category?: CustomerType
  area?: string
}

export class ScraperManager {
  private getScraper(type: ScraperType, city?: City, category?: CustomerType): BaseScraper {
    const config = { city, category }
    
    switch (type) {
      case ScraperType.GOOGLE_MAPS:
        return new GoogleMapsScraper(config)
      case ScraperType.INSTAGRAM:
        return new InstagramScraper(config)
      case ScraperType.DIRECTORY:
        return new DirectoryScraper(config)
      case ScraperType.BUSINESSLIST:
        return new BusinessListScraper(config)
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

    // Run scraping asynchronously
    this.executeScrapingJob(job.id, input).catch((error) => {
      console.error(`Scraping job ${job.id} failed:`, error)
    })

    return job.id
  }

  private async executeScrapingJob(jobId: string, input: ScrapingJobInput): Promise<void> {
    try {
      // Update job status to running
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: ScrapingJobStatus.RUNNING,
          startedAt: new Date(),
        },
      })

      // Get scraper instance
      const scraper = this.getScraper(input.type, input.city, input.category)

      // Handle multiple queries
      const queries = Array.isArray(input.query) ? input.query : [input.query]
      let allScrapedLeads: ScrapedLead[] = []

      for (const query of queries) {
        console.log(`[ScraperManager] ========================================`)
        console.log(`[ScraperManager] Starting scrape for query: "${query}"`)
        console.log(`[ScraperManager] Scraper type: ${input.type}`)
        console.log(`[ScraperManager] City: ${input.city || 'Not specified'}`)
        console.log(`[ScraperManager] ========================================`)
        
        try {
          const scrapedLeads = await scraper.scrape(query.trim())
          console.log(`[ScraperManager] ✓ Query "${query}" completed: ${scrapedLeads.length} leads found`)
          allScrapedLeads = [...allScrapedLeads, ...scrapedLeads]
        } catch (queryError) {
          const errorMsg = queryError instanceof Error ? queryError.message : String(queryError)
          console.error(`[ScraperManager] ✗ Query "${query}" failed:`, errorMsg)
          // Continue with next query instead of failing entire job
        }
      }

      console.log(`[ScraperManager] ========================================`)
      console.log(`[ScraperManager] Scraping Summary:`)
      console.log(`[ScraperManager] - Queries processed: ${queries.length}`)
      console.log(`[ScraperManager] - Total leads found: ${allScrapedLeads.length}`)
      console.log(`[ScraperManager] ========================================`)

      // Deduplicate leads
      const { unique, duplicates } = await deduplicateLeads(allScrapedLeads)
      console.log(`[ScraperManager] After deduplication: ${unique.length} unique, ${duplicates.length} duplicates`)

      // Import unique leads
      const errors: string[] = []
      let importedCount = 0

      for (const lead of unique) {
        try {
          await prisma.lead.create({
            data: {
              name: lead.name,
              phone: lead.phone,
              address: lead.address || null,
              area: lead.area || null,
              city: lead.city,
              category: lead.category,
              status: LeadStatus.SCRAPED,
              source: this.getSourceName(input.type),
            },
          })
          importedCount++
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors.push(`Failed to import ${lead.name}: ${errorMsg}`)
        }
      }

      // Auto-validate imported leads
      let validatedCount = 0
      let verifiedCount = 0
      if (importedCount > 0) {
        try {
          const validationResult = await autoValidateScrapedLeads()
          validatedCount = validationResult.validated
          verifiedCount = validationResult.verified
        } catch (validationError) {
          console.error('Auto-validation error:', validationError)
          // Don't fail the job if validation fails
        }
      }

      // Update job with results
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: ScrapingJobStatus.COMPLETED,
          completedAt: new Date(),
          leadsFound: allScrapedLeads.length,
          leadsImported: importedCount,
          duplicates: duplicates.length,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
        },
      })

      // Cleanup scraper resources
      if ('close' in scraper && typeof scraper.close === 'function') {
        await scraper.close()
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      
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

  private getSourceName(type: ScraperType): string {
    switch (type) {
      case ScraperType.GOOGLE_MAPS:
        return 'Google Maps'
      case ScraperType.INSTAGRAM:
        return 'Instagram'
      case ScraperType.DIRECTORY:
        return 'Business Directory'
      case ScraperType.BUSINESSLIST:
        return 'BusinessList Nigeria'
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

  async getJobHistory(limit: number = 50) {
    return await prisma.scrapingJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
