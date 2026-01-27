'use client'

import { useState, useEffect } from 'react'

interface AnalyticsData {
  overview: {
    totalLeads: number
    totalCustomers: number
    totalOrders: number
    totalRevenue: number
    conversionRate: number
  }
  leads: {
    byStatus: Array<{ status: string; count: number }>
    bySource: Array<{ source: string; count: number }>
  }
  payments: {
    pending: number
    paid: number
  }
  followUps: {
    pending: number
    overdue: number
  }
  charts: {
    ordersByMonth: Array<{ month: string; count: number; revenue: number }>
    revenueByCity: Array<{ city: string; revenue: number }>
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/overview')
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading analytics...</div>
  }

  if (!data) {
    return <div style={{ padding: '2rem' }}>Failed to load analytics</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
        Analytics Dashboard
      </h1>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <MetricCard
          title="Total Leads"
          value={data.overview.totalLeads}
          color="#3b82f6"
        />
        <MetricCard
          title="Customers"
          value={data.overview.totalCustomers}
          color="#10b981"
        />
        <MetricCard
          title="Total Orders"
          value={data.overview.totalOrders}
          color="#8b5cf6"
        />
        <MetricCard
          title="Revenue"
          value={`₦${(data.overview.totalRevenue / 1000).toFixed(1)}k`}
          color="#f59e0b"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.overview.conversionRate}%`}
          color="#ef4444"
        />
      </div>

      {/* Leads by Status */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Leads by Status
        </h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {data.leads.byStatus.map((item) => (
            <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{item.status.replace('_', ' ')}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Leads by Source */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Leads by Source
        </h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {data.leads.bySource.map((item) => (
            <div key={item.source} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{item.source}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Payments */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Payments
        </h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Paid</span>
            <strong style={{ color: '#10b981' }}>₦{data.payments.paid.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pending</span>
            <strong style={{ color: '#f59e0b' }}>₦{data.payments.pending.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Follow-ups */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Follow-ups
        </h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pending Today</span>
            <strong>{data.followUps.pending}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Overdue</span>
            <strong style={{ color: '#ef4444' }}>{data.followUps.overdue}</strong>
          </div>
        </div>
      </div>

      {/* Revenue by City */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Revenue by City
        </h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {data.charts.revenueByCity.map((item) => (
            <div key={item.city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{item.city}</span>
              <strong>₦{item.revenue.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>
        {value}
      </div>
    </div>
  )
}
