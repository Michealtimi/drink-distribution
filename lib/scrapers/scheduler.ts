import * as cron from 'node-cron'
import { ScraperManager } from './scraper-manager'
import { ScraperType, City } from '@prisma/client'

/**
 * Optional auto-scraping scheduler
 * Can be configured to run scrapers on a schedule
 */
export class ScrapingScheduler {
  private manager: ScraperManager
  private tasks: Map<string, cron.ScheduledTask> = new Map()

  constructor() {
    this.manager = new ScraperManager()
  }

  /**
   * Schedule a scraper to run periodically
   */
  schedule(
    id: string,
    scraperType: ScraperType,
    query: string,
    cronExpression: string,
    options?: { city?: City; category?: any }
  ): void {
    // Stop existing task if any
    this.stop(id)

    const task = cron.schedule(
      cronExpression,
      async () => {
        console.log(`[ScrapingScheduler] Running scheduled job: ${id}`)
        try {
          await this.manager.runScrapingJob({
            type: scraperType,
            query,
            city: options?.city,
            category: options?.category,
          })
        } catch (error) {
          console.error(`[ScrapingScheduler] Error running job ${id}:`, error)
        }
      },
      {
        scheduled: true,
        timezone: 'Africa/Lagos',
      }
    )

    this.tasks.set(id, task)
    console.log(`[ScrapingScheduler] Scheduled job ${id} with expression: ${cronExpression}`)
  }

  /**
   * Stop a scheduled task
   */
  stop(id: string): void {
    const task = this.tasks.get(id)
    if (task) {
      task.stop()
      this.tasks.delete(id)
      console.log(`[ScrapingScheduler] Stopped job: ${id}`)
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll(): void {
    for (const [id, task] of this.tasks.entries()) {
      task.stop()
    }
    this.tasks.clear()
    console.log('[ScrapingScheduler] Stopped all jobs')
  }

  /**
   * Get list of active scheduled jobs
   */
  getActiveJobs(): string[] {
    return Array.from(this.tasks.keys())
  }
}

// Example usage (commented out - enable if needed):
// const scheduler = new ScrapingScheduler()
// 
// // Run Google Maps scraper for gyms in Lagos every Monday at 9 AM
// scheduler.schedule(
//   'gyms-lagos-weekly',
//   ScraperType.GOOGLE_MAPS,
//   'gyms fitness centers',
//   '0 9 * * 1', // Every Monday at 9 AM
//   { city: City.LAGOS }
// )
