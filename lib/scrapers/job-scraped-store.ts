/**
 * In-memory store of scraped leads per job (as they are found).
 * Used so the UI can show "leads found so far" while a job runs and when it is cancelled.
 * Data is per-process; lost on server restart.
 */

export interface ScrapedLeadResult {
  name: string
  phone: string
  address?: string
  area?: string
  city: string
  category: string
}

const store = new Map<string, ScrapedLeadResult[]>()

export function setJobScrapedLeads(jobId: string, leads: ScrapedLeadResult[]): void {
  store.set(jobId, leads)
}

export function appendJobScrapedLeads(jobId: string, newLeads: ScrapedLeadResult[]): void {
  const existing = store.get(jobId) ?? []
  store.set(jobId, [...existing, ...newLeads])
}

export function getJobScrapedLeads(jobId: string): ScrapedLeadResult[] {
  return store.get(jobId) ?? []
}

export function clearJobScrapedLeads(jobId: string): void {
  store.delete(jobId)
}
