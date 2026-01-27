'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface RouteCustomer {
  id: string
  sequence: number
  customer: {
    id: string
    name: string
    phone: string
    address: string | null
    area: string | null
  }
}

interface Route {
  id: string
  name: string
  city: string
  dayOfWeek: string
  area: string | null
  isActive: boolean
  customers: RouteCustomer[]
}

export default function RouteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [route, setRoute] = useState<Route | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchRoute()
    }
  }, [params.id])

  const fetchRoute = async () => {
    try {
      const response = await fetch(`/api/routes/${params.id}`)
      const data = await response.json()
      setRoute(data)
    } catch (error) {
      console.error('Error fetching route:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (customerIds: string[]) => {
    try {
      const response = await fetch(`/api/routes/${params.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder')
      }

      fetchRoute()
    } catch (error) {
      console.error('Error reordering:', error)
      alert('Failed to reorder customers')
    }
  }

  const handleRemoveCustomer = async (customerId: string) => {
    if (!confirm('Remove this customer from the route?')) return

    try {
      const response = await fetch(`/api/routes/${params.id}/customers?customerId=${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove customer')
      }

      fetchRoute()
    } catch (error) {
      console.error('Error removing customer:', error)
      alert('Failed to remove customer')
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  if (!route) {
    return <div style={{ padding: '2rem' }}>Route not found</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/routes"
          style={{ color: '#3b82f6', textDecoration: 'underline', marginBottom: '1rem', display: 'inline-block' }}
        >
          ← Back to Routes
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
          {route.name}
        </h1>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
          {route.city} • {route.dayOfWeek} {route.area ? `• ${route.area}` : ''}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Customers on Route ({route.customers.length})
        </h2>

        {route.customers.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No customers on this route yet.</p>
        ) : (
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            padding: '1rem',
          }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {route.customers.map((rc) => (
                <div
                  key={rc.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#6b7280' }}>
                    {rc.sequence}.
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>{rc.customer.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {rc.customer.phone} {rc.customer.area ? `• ${rc.customer.area}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCustomer(rc.customer.id)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link
            href={`/customers?routeId=${route.id}`}
            style={{
              color: '#3b82f6',
              textDecoration: 'underline',
              fontSize: '0.875rem',
            }}
          >
            Add customers to route →
          </Link>
        </div>
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '6px',
        border: '1px solid #bae6fd',
      }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Print Route Sheet
        </button>
      </div>
    </div>
  )
}
