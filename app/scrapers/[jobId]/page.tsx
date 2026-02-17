'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ScrapingJob {
  id: string
  type: string
  status: string
  query: string | null
  city: string | null
  category: string | null
  leadsFound: number
  leadsImported: number
  duplicates: number
  errors: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

interface JobLead {
  id: string
  name: string
  phone: string
  city: string
  category: string
  status: string
  area: string | null
  createdAt: string
}

/** Live scraped rows (as found by the job, before import) */
interface ScrapedResultRow {
  name: string
  phone: string
  address?: string
  area?: string
  city: string
  category: string
}

export default function ScrapingJobPage() {
  const params = useParams()
  const jobId = typeof params.jobId === 'string' ? params.jobId : params.jobId?.[0]
  const [job, setJob] = useState<ScrapingJob | null>(null)
  const [leads, setLeads] = useState<JobLead[]>([])
  const [scrapedResults, setScrapedResults] = useState<ScrapedResultRow[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stopping, setStopping] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (!jobId) return
    fetchJob()
    fetchScrapedResults()
    // Stop polling once job is in a terminal state
    if (job && ['COMPLETED', 'CANCELLED', 'FAILED'].includes(job.status)) return
    const interval = setInterval(() => {
      fetchJob()
      fetchScrapedResults()
    }, 2500)
    return () => clearInterval(interval)
  }, [jobId, job?.status])

  const fetchScrapedResults = async () => {
    if (!jobId) return
    try {
      const res = await fetch(`/api/scrapers/${jobId}/scraped-results`)
      const data = await res.json()
      setScrapedResults(Array.isArray(data) ? data : [])
    } catch {
      setScrapedResults([])
    }
  }

  const fetchJob = async () => {
    if (!jobId) return
    try {
      const response = await fetch(`/api/scrapers/status/${jobId}`)
      const data = await response.json()
      setJob(response.ok ? data : null)
    } catch (error) {
      console.error('Error fetching job:', error)
      setJob(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!jobId || !job || (job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && job.leadsImported === 0)) return
    setLeadsLoading(true)
    fetch(`/api/scrapers/${jobId}/leads`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch(() => setLeads([]))
      .finally(() => setLeadsLoading(false))
  }, [jobId, job?.id, job?.status, job?.leadsImported])

  // When job finishes or is cancelled, refresh live scraped results once so we show final list
  useEffect(() => {
    if (jobId && job && (job.status === 'COMPLETED' || job.status === 'CANCELLED')) {
      fetchScrapedResults()
    }
  }, [jobId, job?.status])

  const handleStop = async () => {
    if (!jobId || stopping) return
    setStopping(true)
    try {
      const res = await fetch(`/api/scrapers/${jobId}/cancel`, { method: 'POST' })
      if (res.ok) await fetchJob()
    } finally {
      setStopping(false)
    }
  }

  const canImportLeads =
    job &&
    (job.status === 'CANCELLED' || (job.status === 'COMPLETED' && job.leadsImported === 0)) &&
    (scrapedResults.length > 0 || job.leadsFound > 0)

  const handleImportLeads = async () => {
    if (!jobId || importing || !canImportLeads) return
    setImporting(true)
    try {
      const res = await fetch(`/api/scrapers/${jobId}/import-leads`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        await fetchJob()
        await fetchScrapedResults()
        setLeadsLoading(true)
        fetch(`/api/scrapers/${jobId}/leads`)
          .then((r) => (r.ok ? r.json() : []))
          .then((d) => setLeads(Array.isArray(d) ? d : []))
          .finally(() => setLeadsLoading(false))
      } else {
        console.error('Import failed:', data.error || data)
      }
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  if (!job) {
    return <div style={{ padding: '2rem' }}>Job not found</div>
  }

  const statusColors: Record<string, string> = {
    PENDING: '#9ca3af',
    RUNNING: '#3b82f6',
    COMPLETED: '#10b981',
    FAILED: '#ef4444',
    CANCELLED: '#6b7280',
  }

  let errors: string[] = []
  if (job.errors) {
    try {
      errors = JSON.parse(job.errors)
    } catch {
      errors = [job.errors]
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/scrapers"
          style={{ color: '#3b82f6', textDecoration: 'underline', marginBottom: '1rem', display: 'inline-block' }}
        >
          ← Back to Scrapers
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
          Scraping Job Details
        </h1>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
              Job Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong>Type:</strong> {job.type.replace('_', ' ')}
              </div>
              <div>
                <strong>Query:</strong> {job.query || '-'}
              </div>
              <div>
                <strong>City:</strong> {job.city || 'All'}
              </div>
              <div>
                <strong>Category:</strong> {job.category ? job.category.replace('_', ' ') : 'All'}
              </div>
              <div>
                <strong>Status:</strong>
                <span
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    backgroundColor: `${statusColors[job.status]}20`,
                    color: statusColors[job.status],
                    fontWeight: '500',
                  }}
                >
                  {job.status}
                </span>
                {(job.status === 'PENDING' || job.status === 'RUNNING') && (
                  <button
                    type="button"
                    onClick={handleStop}
                    disabled={stopping}
                    style={{
                      marginLeft: '1rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: stopping ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '500',
                      cursor: stopping ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {stopping ? 'Stopping…' : 'Stop job'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
              Results
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <strong>Leads Found:</strong> {job.leadsFound}
              </div>
              <div>
                <strong>Leads Imported:</strong> {job.leadsImported}
              </div>
              <div>
                <strong>Duplicates:</strong> {job.duplicates}
              </div>
              {job.startedAt && (
                <div>
                  <strong>Started:</strong> {new Date(job.startedAt).toLocaleString()}
                </div>
              )}
              {job.completedAt && (
                <div>
                  <strong>Completed:</strong> {new Date(job.completedAt).toLocaleString()}
                </div>
              )}
            </div>
            {job.status === 'COMPLETED' && job.leadsFound === 0 && (
              <p style={{ marginTop: '1rem', fontSize: '0.9375rem', color: '#6b7280' }}>
                No leads were found. The target site may be unreachable (e.g. DNS/network). Try another scraper type (e.g. Google Maps, Finelib) or check your network.
              </p>
            )}
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div style={{
          backgroundColor: '#fee2e2',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          marginBottom: '2rem',
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', color: '#991b1b' }}>
            Errors ({errors.length})
          </h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#991b1b' }}>
            {errors.map((error, index) => (
              <li key={index} style={{ marginBottom: '0.5rem' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Leads found (live as the scraper runs; also after cancel/complete) */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            Leads found
            {job.status === 'RUNNING' || job.status === 'PENDING' ? (
              <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontWeight: '500' }}>
                ({scrapedResults.length} so far)
              </span>
            ) : (
              <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontWeight: '500' }}>
                ({scrapedResults.length})
              </span>
            )}
          </h2>
          {canImportLeads && (
            <button
              type="button"
              onClick={handleImportLeads}
              disabled={importing}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: importing ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: importing ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {importing ? 'Importing…' : 'Import these leads'}
            </button>
          )}
        </div>
        {scrapedResults.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            <p style={{ margin: 0 }}>
              {(job.status === 'RUNNING' || job.status === 'PENDING')
                ? 'Waiting for results…'
                : 'No leads were scraped for this job.'}
            </p>
            {job.status === 'FAILED' && (
              <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                If you saw results in the terminal, the in-memory store may have been cleared (e.g. server restarted). Run <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>pnpm db:push</code> and <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>pnpm prisma generate</code>, then restart the server so future results are saved to the DB. See SCRAPER_TROUBLESHOOTING.md.
              </p>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Phone</th>
                  <th style={{ padding: '0.75rem' }}>Address</th>
                  <th style={{ padding: '0.75rem' }}>Area</th>
                  <th style={{ padding: '0.75rem' }}>City</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {scrapedResults.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>{row.name}</td>
                    <td style={{ padding: '0.75rem' }}>{row.phone && row.phone !== 'NO_PHONE' ? row.phone : '–'}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280', maxWidth: '200px' }}>{row.address || '–'}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>{row.area || '–'}</td>
                    <td style={{ padding: '0.75rem' }}>{row.city}</td>
                    <td style={{ padding: '0.75rem' }}>{row.category.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scraped leads list (imported into Leads) */}
      {(job.status === 'COMPLETED' || job.leadsImported > 0) && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
              Scraped leads
              {job.leadsImported > 0 && (
                <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontWeight: '500' }}>
                  ({job.leadsImported} imported)
                </span>
              )}
            </h2>
            <Link
              href="/leads"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                fontWeight: '500',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              View in Leads
            </Link>
          </div>

          {leadsLoading ? (
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Loading leads…</p>
          ) : leads.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              {job.leadsImported === 0
                ? 'No leads were imported (e.g. all duplicates or scrape returned none).'
                : 'Imported leads will appear here. You can also view them in Leads.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem' }}>Phone</th>
                    <th style={{ padding: '0.75rem' }}>Area</th>
                    <th style={{ padding: '0.75rem' }}>City</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem' }}>{lead.name}</td>
                      <td style={{ padding: '0.75rem' }}>{lead.phone && lead.phone !== 'NO_PHONE' ? lead.phone : '–'}</td>
                      <td style={{ padding: '0.75rem', color: '#6b7280' }}>{lead.area || '–'}</td>
                      <td style={{ padding: '0.75rem' }}>{lead.city}</td>
                      <td style={{ padding: '0.75rem' }}>{lead.category.replace(/_/g, ' ')}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                        }}>
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <Link
                          href={`/leads/${lead.id}`}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'underline',
                            fontSize: '0.8125rem',
                          }}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
