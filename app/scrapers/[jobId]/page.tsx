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

export default function ScrapingJobPage() {
  const params = useParams()
  const [job, setJob] = useState<ScrapingJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [stopping, setStopping] = useState(false)

  useEffect(() => {
    if (params.jobId) {
      fetchJob()
      // Poll for updates if job is still running
      const interval = setInterval(() => {
        if (job?.status === 'RUNNING' || job?.status === 'PENDING') {
          fetchJob()
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [params.jobId, job?.status])

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/scrapers/status/${params.jobId}`)
      const data = await response.json()
      setJob(response.ok ? data : null)
    } catch (error) {
      console.error('Error fetching job:', error)
      setJob(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    if (!params.jobId || stopping) return
    setStopping(true)
    try {
      const res = await fetch(`/api/scrapers/${params.jobId}/cancel`, { method: 'POST' })
      if (res.ok) await fetchJob()
    } finally {
      setStopping(false)
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

      {job.status === 'COMPLETED' && job.leadsImported > 0 && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
        }}>
          <Link
            href={`/leads?source=${encodeURIComponent(job.type)}`}
            style={{
              color: '#166534',
              textDecoration: 'underline',
              fontWeight: '500',
            }}
          >
            View imported leads →
          </Link>
        </div>
      )}
    </div>
  )
}
