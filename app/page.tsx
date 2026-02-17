'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LoadingSkeleton from './components/LoadingSkeleton'

const GETTING_STARTED_STEPS = [
  { step: 1, label: 'Find leads', action: 'Run a scraper or add a lead', href: '/scrapers', linkText: 'Scrapers' },
  { step: 2, label: 'Validate', action: 'Move Scraped/Unverified to Verified or Invalid', href: '/leads?status=SCRAPED', linkText: 'Leads' },
  { step: 3, label: 'Open a lead', action: 'Click a Verified lead to open it', href: '/leads?status=VERIFIED', linkText: 'Verified leads' },
  { step: 4, label: 'Message', action: "Click 'Message this lead' → Copy → Open WhatsApp → send", href: '/leads', linkText: 'Leads' },
  { step: 5, label: 'Mark as messaged', action: "After sending, click 'I've sent it – mark as messaged' so follow-ups are scheduled", href: '/today', linkText: 'Today' },
]

interface QuickStats {
  totalLeads: number
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  conversionRate: number
  pendingFollowUps: number
  overdueFollowUps: number
  pendingPayments: number
}

export default function Home() {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showGettingStarted, setShowGettingStarted] = useState(true)

  useEffect(() => {
    fetchQuickStats()
  }, [])

  const fetchQuickStats = async () => {
    try {
      const response = await fetch('/api/analytics/overview')
      const data = await response.json()
      setStats({
        totalLeads: data.overview.totalLeads,
        totalCustomers: data.overview.totalCustomers,
        totalOrders: data.overview.totalOrders,
        totalRevenue: data.overview.totalRevenue,
        conversionRate: data.overview.conversionRate,
        pendingFollowUps: data.followUps.pending,
        overdueFollowUps: data.followUps.overdue,
        pendingPayments: data.payments.pending,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ height: '3rem', width: '400px', backgroundColor: '#e5e7eb', borderRadius: '6px', marginBottom: '1rem' }} />
          <div style={{ height: '1.5rem', width: '600px', backgroundColor: '#e5e7eb', borderRadius: '6px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ height: '1rem', width: '100px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '0.5rem' }} />
              <div style={{ height: '2rem', width: '150px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem',
            color: '#111827',
          }}>
            Dashboard
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#6b7280',
          }}>
            Welcome back! Here's an overview of your beverage distribution business.
          </p>
        </div>

        {/* Getting started */}
        <div style={{
          marginBottom: '2rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => setShowGettingStarted((v) => !v)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e40af',
            }}
          >
            Getting started
            <span style={{ fontSize: '1.25rem' }}>{showGettingStarted ? '−' : '+'}</span>
          </button>
          {showGettingStarted && (
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <p style={{ color: '#1e3a8a', marginBottom: '1rem', fontSize: '0.9375rem' }}>
                New here? Follow these steps to find leads, sort them, and send your first message.
              </p>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e3a8a', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {GETTING_STARTED_STEPS.map(({ step, label, action, href, linkText }) => (
                  <li key={step} style={{ fontSize: '0.9375rem' }}>
                    <strong>{label}:</strong> {action}{' '}
                    <Link href={href} style={{ color: '#1d4ed8', fontWeight: '600' }}>{linkText}</Link>
                  </li>
                ))}
              </ol>
              <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.875rem', color: '#1e3a8a' }}>
                Or go to <Link href="/today" style={{ color: '#1d4ed8', fontWeight: '600' }}>Today</Link> to see your action queue (follow-ups + leads to message).
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
            <StatCard
              title="Total Leads"
              value={stats.totalLeads.toLocaleString()}
              color="#3b82f6"
              icon="📋"
              href="/leads"
            />
            <StatCard
              title="Customers"
              value={stats.totalCustomers.toLocaleString()}
              color="#10b981"
              icon="👥"
              href="/customers"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              color="#8b5cf6"
              icon="📦"
              href="/orders"
            />
            <StatCard
              title="Revenue"
              value={`₦${(stats.totalRevenue / 1000).toFixed(1)}k`}
              color="#f59e0b"
              icon="💰"
              href="/analytics"
            />
            <StatCard
              title="Conversion Rate"
              value={`${stats.conversionRate.toFixed(1)}%`}
              color="#ef4444"
              icon="📊"
            />
            <StatCard
              title="Pending Follow-ups"
              value={stats.pendingFollowUps.toString()}
              color={stats.pendingFollowUps > 0 ? '#f59e0b' : '#10b981'}
              icon="⏰"
              href="/leads?status=VERIFIED"
            />
          </div>
        )}

        {/* Alerts */}
        {stats && (stats.overdueFollowUps > 0 || stats.pendingPayments > 0) && (
          <div style={{
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            {stats.overdueFollowUps > 0 && (
              <div style={{
                padding: '1rem 1.5rem',
                backgroundColor: '#fee2e2',
                borderLeft: '4px solid #ef4444',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <strong style={{ color: '#991b1b' }}>⚠️ {stats.overdueFollowUps} Overdue Follow-ups</strong>
                  <p style={{ color: '#991b1b', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                    You have follow-ups that need attention
                  </p>
                </div>
                <Link
                  href="/leads?status=VERIFIED"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  View Leads
                </Link>
              </div>
            )}
            {stats.pendingPayments > 0 && (
              <div style={{
                padding: '1rem 1.5rem',
                backgroundColor: '#fef3c7',
                borderLeft: '4px solid #f59e0b',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <strong style={{ color: '#92400e' }}>💰 ₦{stats.pendingPayments.toLocaleString()} Pending Payments</strong>
                  <p style={{ color: '#92400e', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                    Follow up on outstanding payments
                  </p>
                </div>
                <Link
                  href="/orders"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  View Orders
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '1.5rem',
            color: '#111827',
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <QuickActionLink
              href="/leads/new"
              icon="➕"
              label="Add Lead"
              description="Manually add a new lead"
            />
            <QuickActionLink
              href="/scrapers"
              icon="🔍"
              label="Run Scraper"
              description="Start scraping leads"
            />
            <QuickActionLink
              href="/leads?status=SCRAPED"
              icon="✅"
              label="Verify Leads"
              description="Review scraped leads"
            />
            <QuickActionLink
              href="/routes/new"
              icon="🗺️"
              label="Create Route"
              description="Plan delivery route"
            />
            <QuickActionLink
              href="/customers"
              icon="👥"
              label="View Customers"
              description="Manage customers"
            />
            <QuickActionLink
              href="/analytics"
              icon="📊"
              label="View Analytics"
              description="See business metrics"
            />
          </div>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '1.5rem',
            color: '#111827',
          }}>
            Main Sections
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}>
            <NavCard
              href="/leads"
              icon="📋"
              title="Leads"
              description="Manage and verify leads"
              color="#3b82f6"
            />
            <NavCard
              href="/customers"
              icon="👥"
              title="Customers"
              description="View customers and orders"
              color="#10b981"
            />
            <NavCard
              href="/orders"
              icon="📦"
              title="Orders"
              description="Track orders and payments"
              color="#8b5cf6"
            />
            <NavCard
              href="/routes"
              icon="🗺️"
              title="Routes"
              description="Plan delivery routes"
              color="#f59e0b"
            />
            <NavCard
              href="/scrapers"
              icon="🔍"
              title="Scrapers"
              description="Automated lead generation"
              color="#6366f1"
            />
            <NavCard
              href="/analytics"
              icon="📊"
              title="Analytics"
              description="View metrics and insights"
              color="#ef4444"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon, href }: { 
  title: string
  value: string | number
  color: string
  icon: string
  href?: string
}) {
  const content = (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      borderTop: `4px solid ${color}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: href ? 'pointer' : 'default',
    }}
    onMouseEnter={(e) => {
      if (href) {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
      }
    }}
    onMouseLeave={(e) => {
      if (href) {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{title}</div>
        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>{value}</div>
    </div>
  )

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>
  }

  return content
}

function QuickActionLink({ href, icon, label, description }: {
  href: string
  icon: string
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      style={{
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        border: '1px solid #e0e0e0',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s',
        display: 'block',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f3f4f6'
        e.currentTarget.style.borderColor = '#3b82f6'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f9fafb'
        e.currentTarget.style.borderColor = '#e0e0e0'
      }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#111827' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{description}</div>
    </Link>
  )
}

function NavCard({ href, icon, title, description, color }: {
  href: string
  icon: string
  title: string
  description: string
  color: string
}) {
  return (
    <Link
      href={href}
      style={{
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '2px solid #e0e0e0',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s',
        display: 'block',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e0e0e0'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '600', 
        marginBottom: '0.5rem',
        color: '#111827',
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: '0.875rem', 
        color: '#6b7280',
        margin: 0,
      }}>
        {description}
      </p>
    </Link>
  )
}
