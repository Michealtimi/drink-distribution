'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ToastContainer, { useToast } from '../components/Toast'

const SCRAPER_OPTIONS = [
  { value: 'GOOGLE_MAPS', label: 'Google Maps', description: 'Search businesses on Google Maps' },
  { value: 'INSTAGRAM', label: 'Instagram', description: 'Scrape business pages from Instagram' },
  { value: 'DIRECTORY', label: 'Business Directory', description: 'General business directory sites' },
  { value: 'BUSINESSLIST', label: 'BusinessList Nigeria', description: 'BusinessList.ng directory' },
  { value: 'FINELIB', label: 'Finelib', description: 'Finelib.com business listings' },
  { value: 'FACEBOOK', label: 'Facebook', description: 'Facebook business pages' },
] as const

const CITIES = [
  { value: '', label: 'Any' },
  { value: 'LAGOS', label: 'Lagos' },
  { value: 'ABUJA', label: 'Abuja' },
]

const CATEGORIES = [
  { value: '', label: 'Any' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'CONSUMER', label: 'Consumer' },
  { value: 'GYM', label: 'Gym' },
  { value: 'EVENT_CENTER', label: 'Event Center' },
  { value: 'CLUB', label: 'Club' },
  { value: 'LOUNGE', label: 'Lounge' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'SMALL_RETAILER', label: 'Small Retailer' },
  { value: 'OTHER', label: 'Other' },
]

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
  createdAt: string
  completedAt: string | null
}

const statusColor: Record<string, string> = {
  PENDING: '#f59e0b',
  RUNNING: '#3b82f6',
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  CANCELLED: '#6b7280',
}

export default function ScrapersPage() {
  const { toasts, showToast, removeToast } = useToast()
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [queries, setQueries] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [running, setRunning] = useState(false)
  const [jobs, setJobs] = useState<ScrapingJob[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [jobHistoryFilter, setJobHistoryFilter] = useState<string>('')
  const [historyError, setHistoryError] = useState<string | null>(null)

  const fetchHistory = useCallback(
    async (options?: { showLoading?: boolean }): Promise<boolean> => {
      const showSpinner = options?.showLoading ?? false
      if (showSpinner) {
        setLoadingHistory(true)
        setHistoryError(null)
      }
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 22000)
      try {
        const res = await fetch('/api/scrapers/history?limit=50', { signal: controller.signal })
        clearTimeout(timeoutId)
        const data = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(data)) {
          setJobs(data)
          setHistoryError(null)
          return true
        }
        if (showSpinner) {
          setJobs([])
          const msg = data?.error || (res.status === 503 ? 'Server timed out' : 'Failed to load')
          setHistoryError(msg)
          if (res.status !== 503 && res.status !== 500) showToast(msg, 'error')
        }
        return false
      } catch (err) {
        clearTimeout(timeoutId)
        const isAbort = err instanceof Error && err.name === 'AbortError'
        if (showSpinner) {
          setJobs([])
          setHistoryError(
            isAbort
              ? 'Request timed out. The database may be slow or unreachable.'
              : 'Network or server error. Check that the app and database are running.'
          )
          showToast(isAbort ? 'Job history load timed out' : 'Failed to load job history', 'error')
        }
        return false
      } finally {
        if (showSpinner) setLoadingHistory(false)
      }
    },
    [showToast]
  )

  const fetchHistoryRef = useRef(fetchHistory)
  fetchHistoryRef.current = fetchHistory

  useEffect(() => {
    let cancelled = false
    const runInitialWithRetry = async (attempt = 0) => {
      const ok = await fetchHistoryRef.current({ showLoading: true })
      if (cancelled) return
      if (!ok && attempt < 1) {
        await new Promise((r) => setTimeout(r, 2000))
        if (!cancelled) await runInitialWithRetry(attempt + 1)
      }
    }
    runInitialWithRetry()
    const interval = setInterval(() => fetchHistoryRef.current({ showLoading: false }), 10000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const toggleScraper = (value: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const handleRun = async () => {
    const types = Array.from(selectedTypes)
    if (types.length === 0) {
      showToast('Select at least one scraper', 'error')
      return
    }
    const queryInput = queries.trim()
      ? queries.split(/[\n,]/).map((q) => q.trim()).filter(Boolean)
      : query.trim()
        ? [query.trim()]
        : []
    if (queryInput.length === 0) {
      showToast('Enter at least one search query', 'error')
      return
    }
    setRunning(true)
    try {
      const res = await fetch('/api/scrapers/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          types,
          queries: queryInput,
          query: queryInput.length === 1 ? queryInput[0] : undefined,
          city: city || undefined,
          category: category || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to start scraper', 'error')
        return
      }
      showToast(`Started ${data.jobIds?.length || 1} job(s). Check history below.`, 'success')
      fetchHistory()
    } catch {
      showToast('Failed to start scraper', 'error')
    } finally {
      setRunning(false)
    }
  }

  const handleStopJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/scrapers/${jobId}/cancel`, { method: 'POST' })
      const data = res.ok ? await res.json() : {}
      if (!res.ok) throw new Error(data.error || 'Failed to cancel')
      showToast('Job cancelled', 'success')
      fetchHistory()
    } catch {
      showToast('Failed to cancel job', 'error')
    }
  }, [showToast])

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Web scrapers</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        Get leads (gyms, event centers, clubs, lounges, offices, retailers) in Lagos or Abuja into <strong>Leads</strong> so you can message and convert.
      </p>
      <p style={{ color: '#374151', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        <strong>Recommended:</strong> Use the <strong>internal scrapers</strong> below (Finelib, Directory, Google Maps, BusinessList). One setup, no external services.
      </p>

      {/* Internal scrapers — primary path */}
      <Section
        title="Internal scrapers (Playwright)"
        badge="Recommended · Free · Runs locally"
        description="Built-in scrapers that run on your machine. Best for: gyms, events, clubs, lounges, offices, small retailers in Lagos/Abuja."
        flow="Select scraper(s) → enter query (e.g. gym, event center, lounge) → choose city → Start → jobs run → results in Leads and Job history below."
        pattern="One flow for all internal scrapers; no Axiom or Apify required."
      >
        <div style={{ marginBottom: '1rem', padding: '1rem 1.25rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', fontSize: '0.875rem' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#1e40af' }}>First-time setup</strong>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e3a8a' }}>
            <li><code style={{ backgroundColor: '#dbeafe', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>pnpm install</code></li>
            <li><code style={{ backgroundColor: '#dbeafe', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>npx playwright install chromium</code></li>
            <li>Select one or more scrapers below, enter a query (e.g. <strong>gym</strong>, <strong>event center</strong>, <strong>lounge</strong>), choose city, then click <strong>Start</strong>.</li>
          </ol>
          <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#1e3a8a', fontSize: '0.8rem' }}>If jobs finish with 0 leads, run <code style={{ backgroundColor: '#dbeafe', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>npx playwright install chromium</code>. If Job history fails to load, set <code style={{ backgroundColor: '#dbeafe', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>DATABASE_URL</code> in <code style={{ backgroundColor: '#dbeafe', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>.env</code> and run <code style={{ backgroundColor: '#dbeafe', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>pnpm db:push</code>.</p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong>Select scrapers to run</strong>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => setSelectedTypes(new Set(SCRAPER_OPTIONS.map((s) => s.value)))} style={btnSecondary}>All</button>
              <button type="button" onClick={() => setSelectedTypes(new Set())} style={btnSecondary}>None</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {SCRAPER_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', border: `2px solid ${selectedTypes.has(opt.value) ? '#3b82f6' : '#e5e7eb'}`, borderRadius: '8px', backgroundColor: selectedTypes.has(opt.value) ? '#eff6ff' : '#fff', cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedTypes.has(opt.value)} onChange={() => toggleScraper(opt.value)} style={{ marginTop: '0.2rem' }} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>Query (single or multiple, comma/newline)</label>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. gym, event center, lounge" style={inputStyle} />
            <textarea value={queries} onChange={(e) => setQueries(e.target.value)} placeholder="Or multiple queries…" rows={3} style={{ ...inputStyle, marginTop: '0.5rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle}>
              {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <label style={{ display: 'block', marginBottom: '0.25rem', marginTop: '0.75rem', fontWeight: '500', fontSize: '0.875rem' }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
              <button type="button" onClick={handleRun} disabled={running} style={{ padding: '0.75rem 1.5rem', backgroundColor: running ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: running ? 'not-allowed' : 'pointer' }}>
                {running ? 'Starting…' : 'Start'}
              </button>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Runs selected scrapers. Stop running jobs from the table below.</span>
            </div>
          </div>
        </div>
        <JobHistoryTable
          jobs={jobHistoryFilter ? jobs.filter((j) => j.type === jobHistoryFilter) : jobs}
          loading={loadingHistory}
          historyError={historyError}
          onRefresh={fetchHistory}
          onStopJob={handleStopJob}
          filterType={jobHistoryFilter}
          onFilterChange={setJobHistoryFilter}
        />
      </Section>
    </div>
  )
}

function Section({
  title,
  badge,
  description,
  flow,
  pattern,
  children,
}: {
  title: string
  badge: string
  description: string
  flow?: string
  pattern?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>{title}</h2>
        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', backgroundColor: '#d1fae5', color: '#065f46', fontSize: '0.75rem', fontWeight: '500' }}>{badge}</span>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', marginTop: 0 }}>{description}</p>
      {(flow || pattern) && (
        <div style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {flow && <div><strong>Flow:</strong> {flow}</div>}
          {pattern && <div><strong>Pattern:</strong> {pattern}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }
const btnSecondary: React.CSSProperties = { padding: '0.35rem 0.75rem', fontSize: '0.875rem', border: '1px solid #d1d5db', borderRadius: '6px', background: '#f9fafb', cursor: 'pointer' }

const JOB_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All scrapers' },
  ...SCRAPER_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

function JobHistoryTable({
  jobs,
  loading,
  historyError,
  onRefresh,
  onStopJob,
  filterType,
  onFilterChange,
}: {
  jobs: ScrapingJob[]
  loading: boolean
  historyError: string | null
  onRefresh: () => void
  onStopJob: (jobId: string) => Promise<void>
  filterType: string
  onFilterChange: (type: string) => void
}) {
  const [stoppingId, setStoppingId] = useState<string | null>(null)

  const handleStop = async (jobId: string) => {
    setStoppingId(jobId)
    try {
      await onStopJob(jobId)
      onRefresh()
    } finally {
      setStoppingId(null)
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <strong>Job history</strong>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>Each row is one run. Use <strong>View details</strong> to see that job's full history (status, errors, imported leads).</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: '#4b5563' }}>Scraper:</label>
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', backgroundColor: 'white' }}
          >
            {JOB_TYPE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button type="button" onClick={onRefresh} style={btnSecondary}>Refresh</button>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Loading job history…</p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem', marginBottom: 0 }}>Connecting to database. This may take a few seconds on first load.</p>
        </div>
      ) : historyError ? (
        <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <p style={{ fontSize: '0.875rem', color: '#991b1b', margin: 0, fontWeight: '500' }}>Job history could not be loaded</p>
          <p style={{ fontSize: '0.875rem', color: '#b91c1c', marginTop: '0.5rem', marginBottom: '0.75rem' }}>{historyError}</p>
          <p style={{ fontSize: '0.8rem', color: '#7f1d1d', marginBottom: '0.75rem' }}>Ensure <code style={{ background: '#fee2e2', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>DATABASE_URL</code> is set in <code style={{ background: '#fee2e2', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>.env</code> and the database is running. Run <code style={{ background: '#fee2e2', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>pnpm db:push</code> if you haven't applied migrations.</p>
          <button type="button" onClick={onRefresh} style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, fontWeight: '500' }}>
            {filterType ? `No jobs for this scraper yet.` : 'No scraper jobs yet.'}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', marginBottom: 0 }}>
            {filterType ? 'Run this scraper above to see rows here.' : 'Select one or more scrapers above, enter a query, and click Start. Each job will appear here with View details and Stop.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Query</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Found</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>Imported</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Created</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>{job.type.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '500', backgroundColor: `${statusColor[job.status] || '#6b7280'}20`, color: statusColor[job.status] || '#374151' }}>{job.status}</span>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.query || undefined}>{job.query || '–'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{job.leadsFound}</td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>{job.leadsImported}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#6b7280' }}>{new Date(job.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(job.status === 'PENDING' || job.status === 'RUNNING') && (
                      <button
                        type="button"
                        onClick={() => handleStop(job.id)}
                        disabled={stoppingId === job.id}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: stoppingId === job.id ? '#9ca3af' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: '500',
                          cursor: stoppingId === job.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {stoppingId === job.id ? 'Stopping…' : 'Stop'}
                      </button>
                    )}
                    <a
                      href={`/scrapers/${job.id}`}
                      style={{
                        display: 'inline-block',
                        padding: '0.35rem 0.75rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: '500',
                      }}
                    >
                      View details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

