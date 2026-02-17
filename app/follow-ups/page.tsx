'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LoadingSkeleton from '../components/LoadingSkeleton'

interface FollowUpWithLead {
  id: string
  leadId: string
  scheduledFor: string
  completed: boolean
  notes: string | null
  lead: { id: string; name: string; phone: string; status: string }
}

export default function FollowUpsListPage() {
  const [pending, setPending] = useState<FollowUpWithLead[]>([])
  const [overdue, setOverdue] = useState<FollowUpWithLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/follow-ups/pending')
        if (res.ok) {
          const data = await res.json()
          setPending(data.pending || [])
          setOverdue(data.overdue || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <LoadingSkeleton rows={6} columns={4} />
      </div>
    )
  }

  const hasOverdue = overdue.length > 0
  const hasPending = pending.length > 0
  const empty = !hasOverdue && !hasPending

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Follow-ups</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
        Pending and overdue follow-ups. Open a lead to generate the message and send via WhatsApp.
      </p>

      {empty && (
        <div style={{
          padding: '2rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          textAlign: 'center',
        }}>
          <p style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>No follow-ups due</p>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginBottom: '1rem' }}>
            When you mark leads as messaged, follow-ups are scheduled for Day 2, Day 5, and month-end. Check back then or message more Verified leads.
          </p>
          <Link
            href="/leads?status=VERIFIED"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            View Verified leads
          </Link>
        </div>
      )}

      {hasOverdue && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#b91c1c' }}>
            Overdue ({overdue.length})
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Lead</th>
                  <th style={{ padding: '0.75rem' }}>Due</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((fu) => (
                  <tr key={fu.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>{fu.lead?.name ?? '–'}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>{new Date(fu.scheduledFor).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <Link
                        href={`/leads/${fu.leadId}`}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: '500',
                          textDecoration: 'none',
                        }}
                      >
                        Generate message
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hasPending && (
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#b45309' }}>
            Pending ({pending.length})
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Lead</th>
                  <th style={{ padding: '0.75rem' }}>Scheduled for</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((fu) => (
                  <tr key={fu.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem' }}>{fu.lead?.name ?? '–'}</td>
                    <td style={{ padding: '0.75rem', color: '#6b7280' }}>{new Date(fu.scheduledFor).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <Link
                        href={`/leads/${fu.leadId}`}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: '500',
                          textDecoration: 'none',
                        }}
                      >
                        Generate message
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
