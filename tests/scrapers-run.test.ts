import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockRunScrapingJob = vi.fn().mockResolvedValue('job-id-123')
vi.mock('@/lib/scrapers/scraper-manager', () => ({
  ScraperManager: vi.fn().mockImplementation(() => ({
    runScrapingJob: mockRunScrapingJob,
  })),
}))

import { POST } from '@/app/api/scrapers/run/route'

function nextRequestPost(body: object) {
  return new NextRequest('http://localhost/api/scrapers/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Scrapers run API', () => {
  beforeEach(() => {
    mockRunScrapingJob.mockClear()
  })

  it('returns 400 when type is missing', async () => {
    const req = nextRequestPost({ query: 'gym' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBeDefined()
    expect(mockRunScrapingJob).not.toHaveBeenCalled()
  })

  it('returns 400 when query is missing', async () => {
    const req = nextRequestPost({ type: 'GOOGLE_MAPS' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBeDefined()
    expect(mockRunScrapingJob).not.toHaveBeenCalled()
  })

  it('returns 200 with jobId when type and query provided', async () => {
    const req = nextRequestPost({ type: 'GOOGLE_MAPS', query: 'gym Lagos' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.jobIds).toEqual(['job-id-123'])
    expect(json.jobId).toBe('job-id-123')
    expect(mockRunScrapingJob).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GOOGLE_MAPS',
        query: 'gym Lagos',
      })
    )
  })
})
