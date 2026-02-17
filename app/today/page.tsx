'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import LoadingSkeleton from '../components/LoadingSkeleton'

interface FollowUpWithLead {
  id: string
  leadId: string
  scheduledFor: string
  completed: boolean
  lead: { id: string; name: string; phone: string; status: string }
}

interface LeadItem {
  id: string
  name: string
  phone: string
  status: string
  city: string
  category: string
}

interface RouteCustomer {
  sequence: number
  id: string
  name: string
  phone: string
  address: string | null
  area: string | null
  city: string
}

interface TodayRoute {
  id: string
  name: string
  city: string
  area: string | null
  dayOfWeek: string
  customers: RouteCustomer[]
}

interface TodayRoutesData {
  dayOfWeek: string
  routes: TodayRoute[]
}

export default function TodayPage() {
  const [pending, setPending] = useState<FollowUpWithLead[]>([])
  const [overdue, setOverdue] = useState<FollowUpWithLead[]>([])
  const [verifiedLeads, setVerifiedLeads] = useState<LeadItem[]>([])
  const [todayRoutes, setTodayRoutes] = useState<TodayRoutesData | null>(null)
  const [loading, setLoading] = useState(true)
  const routePrintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [followUpsRes, leadsRes, routesRes] = await Promise.all([
          fetch('/api/follow-ups/pending'),
          fetch('/api/leads?status=VERIFIED&limit=10&sortBy=priority&sortOrder=desc'),
          fetch('/api/routes/today'),
        ])
        if (followUpsRes.ok) {
          const data = await followUpsRes.json()
          setPending(data.pending || [])
          setOverdue(data.overdue || [])
        }
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json()
          const list = leadsData?.data ?? (Array.isArray(leadsData) ? leadsData : [])
          setVerifiedLeads(list.slice(0, 10))
        }
        if (routesRes.ok) {
          const routesData = await routesRes.json()
          setTodayRoutes(routesData)
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
        <LoadingSkeleton rows={5} columns={3} />
      </div>
    )
  }

  const hasOverdue = overdue.length > 0
  const hasPending = pending.length > 0
  const hasVerified = verifiedLeads.length > 0
  const hasRoutes = todayRoutes?.routes?.length ? todayRoutes.routes.length > 0 : false
  const empty = !hasOverdue && !hasPending && !hasVerified && !hasRoutes

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Today</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
        Your action queue: follow-ups due and Verified leads to message. One click to open the lead and send.
      </p>

      {empty && (
        <div style={{
          padding: '2rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          textAlign: 'center',
        }}>
          <p style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Nothing due right now</p>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginBottom: '1rem' }}>
            No follow-ups due today and no Verified leads in the queue. Get more leads or validate existing ones.
          </p>
          <Link
            href="/leads?status=SCRAPED"
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
            Validate leads
          </Link>
          <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>or</span>
          <Link
            href="/scrapers"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            Run scrapers
          </Link>
        </div>
      )}

      {hasRoutes && todayRoutes && (
        <section style={{ marginBottom: '2rem' }} ref={routePrintRef}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#065f46' }}>
              Today&apos;s delivery routes ({todayRoutes.dayOfWeek})
            </h2>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Print route
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {todayRoutes.routes.map((route) => (
              <div
                key={route.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{route.name}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                  {route.city}{route.area ? ` · ${route.area}` : ''}
                </div>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {route.customers.map((c) => (
                    <li key={c.id} style={{ fontSize: '0.9375rem' }}>
                      <strong>{c.name}</strong>
                      {c.phone && <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>{c.phone}</span>}
                      {c.address && <span style={{ display: 'block', color: '#6b7280', fontSize: '0.875rem' }}>{c.address}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasOverdue && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#b91c1c' }}>
            Overdue follow-ups ({overdue.length})
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {overdue.map((fu) => (
              <li
                key={fu.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong>{fu.lead?.name ?? 'Lead'}</strong>
                  <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    Due {new Date(fu.scheduledFor).toLocaleDateString()}
                  </span>
                </div>
                <Link
                  href={`/leads/${fu.leadId}`}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  Message this lead
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasPending && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#b45309' }}>
            Due today ({pending.length})
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pending.map((fu) => (
              <li
                key={fu.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong>{fu.lead?.name ?? 'Lead'}</strong>
                  <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    Today
                  </span>
                </div>
                <Link
                  href={`/leads/${fu.leadId}`}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  Message this lead
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasVerified && (
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1d4ed8' }}>
            Verified leads to message ({verifiedLeads.length})
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            Ready to message. Open a lead → Message this lead → Copy → Open WhatsApp → I've sent it.
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {verifiedLeads.map((lead) => (
              <li
                key={lead.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #93c5fd',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong>{lead.name}</strong>
                  <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    {lead.city} · {lead.category.replace('_', ' ')}
                  </span>
                </div>
                <Link
                  href={`/leads/${lead.id}`}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  Message this lead
                </Link>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            <Link href="/leads?status=VERIFIED" style={{ color: '#2563eb', fontWeight: '500' }}>
              View all Verified leads →
            </Link>
          </p>
        </section>
      )}
    </div>
  )
}
