'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AxiomImport {
  id: string
  name: string
  source: string
  createdAt: string
  city: string
  category: string
}

interface SourceGroup {
  source: string
  count: number
  recent: AxiomImport[]
}

interface AxiomStatistics {
  totalImportedToday: number
  totalImportedThisMonth: number
  successRate: number
  hoursUsed: number
  daysRemaining: number
  quotaLimit: number
}

interface AxiomData {
  recentImports: SourceGroup[]
  statistics: AxiomStatistics
  recentLeads: AxiomImport[]
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export default function ScrapersPage() {
  const router = useRouter()
  const [data, setData] = useState<AxiomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [testingApi, setTestingApi] = useState(false)

  // Toast notification system
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  // Fetch Axiom data
  const fetchAxiomData = useCallback(async () => {
    try {
      const response = await fetch('/api/leads/axiom?limit=20')
      if (!response.ok) {
        throw new Error('Failed to fetch Axiom data')
      }
      const result = await response.json()
      
      if (result.success) {
        setData((prevData) => {
          // Check for new imports and show toast
          if (prevData) {
            const currentCount = result.statistics.totalImportedThisMonth
            const prevCount = prevData.statistics.totalImportedThisMonth
            if (currentCount > prevCount) {
              const newImports = currentCount - prevCount
              showToast(`✅ ${newImports} new lead${newImports > 1 ? 's' : ''} imported from Axiom.ai`, 'success')
            }
          }
          return result
        })
        setError(null)
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      showToast(`Error: ${errorMessage}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Real-time polling every 5 seconds
  useEffect(() => {
    fetchAxiomData()
    const interval = setInterval(fetchAxiomData, 5000)
    return () => clearInterval(interval)
  }, [fetchAxiomData])

  // Test API endpoint
  const testApiEndpoint = async () => {
    setTestingApi(true)
    try {
      const apiUrl = `${window.location.origin}/api/leads/axiom`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leads: [
            {
              name: 'Test Business',
              phone: '2348012345678',
              city: 'LAGOS',
              category: 'GYM',
              source: 'Axiom.ai - Test',
            },
          ],
          source: 'Axiom.ai - Test',
        }),
      })

      const result = await response.json()
      if (result.success) {
        showToast('✅ API endpoint is working! Test lead imported successfully.', 'success')
        fetchAxiomData() // Refresh data
      } else {
        showToast(`❌ API test failed: ${result.error || 'Unknown error'}`, 'error')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      showToast(`❌ API test failed: ${errorMessage}`, 'error')
    } finally {
      setTestingApi(false)
    }
  }

  // Get API endpoint URL
  const getApiEndpoint = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/leads/axiom`
    }
    return '/api/leads/axiom'
  }

  // Copy API endpoint to clipboard
  const copyApiEndpoint = () => {
    const endpoint = getApiEndpoint()
    navigator.clipboard.writeText(endpoint)
    showToast('API endpoint copied to clipboard!', 'success')
  }

  // Get environment indicator
  const getEnvironment = () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' ? 'Local' : 'Production'
    }
    return 'Unknown'
  }

  // Calculate quota warning
  const getQuotaWarning = () => {
    if (!data) return null
    const percentage = (data.statistics.hoursUsed / data.statistics.quotaLimit) * 100
    if (percentage >= 100) {
      return { level: 'error', message: 'Quota exceeded!' }
    }
    if (percentage >= 75) {
      return { level: 'warning', message: 'Quota approaching limit' }
    }
    return null
  }

  if (loading && !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading Axiom.ai data...</div>
      </div>
    )
  }

  const quotaWarning = getQuotaWarning()

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notifications */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minWidth: '300px',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Lead Scrapers (Axiom.ai)
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Browser automation for lead generation. All imports are handled via Axiom.ai bots.
        </p>
      </div>

      {/* Quota Usage Card */}
      {data && (
        <div
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Quota Usage</h2>
            {quotaWarning && (
              <span
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: quotaWarning.level === 'error' ? '#fee2e2' : '#fef3c7',
                  color: quotaWarning.level === 'error' ? '#991b1b' : '#92400e',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                ⚠️ {quotaWarning.message}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hours Used</span>
              <span style={{ fontWeight: '600' }}>
                {data.statistics.hoursUsed.toFixed(2)} / {data.statistics.quotaLimit.toFixed(1)} hours
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (data.statistics.hoursUsed / data.statistics.quotaLimit) * 100)}%`,
                  height: '100%',
                  backgroundColor:
                    quotaWarning?.level === 'error'
                      ? '#ef4444'
                      : quotaWarning?.level === 'warning'
                      ? '#f59e0b'
                      : '#10b981',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Leads Imported</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{data.statistics.totalImportedThisMonth}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>This month</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Imported Today</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{data.statistics.totalImportedToday}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Last 24 hours</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Days Remaining</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{data.statistics.daysRemaining}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>In current month</div>
            </div>
          </div>
        </div>
      )}

      {/* Axiom.ai Setup Section */}
      <div
        style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Axiom.ai Setup</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            API Endpoint
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              readOnly
              value={getApiEndpoint()}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#f9fafb',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={copyApiEndpoint}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              Copy
            </button>
            <button
              onClick={testApiEndpoint}
              disabled={testingApi}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: testingApi ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: testingApi ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                opacity: testingApi ? 0.6 : 1,
              }}
            >
              {testingApi ? 'Testing...' : 'Test API'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Environment: <strong>{getEnvironment()}</strong>
          </div>
        </div>

        <div>
          <Link
            href="/AXIOM_AI_SETUP.md"
            target="_blank"
            style={{
              color: '#3b82f6',
              textDecoration: 'underline',
              fontSize: '0.875rem',
            }}
          >
            📖 View Setup Instructions →
          </Link>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Recent Activity Feed</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', margin: 0 }}>
            Last 20 imports from Axiom.ai bots (updates every 5 seconds)
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && data.recentLeads.length > 0 ? (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Time
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Business Name
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Source
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    City
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Category
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentLeads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{lead.name}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {lead.source || 'Axiom.ai'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{lead.city}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{lead.category}</td>
                    <td style={{ padding: '1rem' }}>
                      <Link
                        href={`/leads/${lead.id}`}
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'underline',
                          fontSize: '0.875rem',
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ marginBottom: '0.5rem' }}>No imports yet</div>
            <div style={{ fontSize: '0.875rem' }}>
              Set up your Axiom.ai bot and start importing leads. Check the setup guide above.
            </div>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {data && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Import Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Success Rate</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                {data.statistics.successRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Quota Usage</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                {((data.statistics.hoursUsed / data.statistics.quotaLimit) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
