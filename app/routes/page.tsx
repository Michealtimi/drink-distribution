'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ToastContainer, { useToast } from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

interface Route {
  id: string
  name: string
  city: string
  dayOfWeek: string
  area: string | null
  isActive: boolean
  customers: Array<{
    sequence: number
    customer: {
      id: string
      name: string
      phone: string
      address: string | null
      area: string | null
    }
  }>
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCity, setFilterCity] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchRoutes()
  }, [filterCity])

  // Filter routes by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRoutes(routes)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = routes.filter((route) => {
      return (
        route.name.toLowerCase().includes(query) ||
        route.city.toLowerCase().includes(query) ||
        (route.area && route.area.toLowerCase().includes(query)) ||
        route.dayOfWeek.toLowerCase().includes(query)
      )
    })
    setFilteredRoutes(filtered)
  }, [searchQuery, routes])

  const fetchRoutes = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCity) params.append('city', filterCity)

      const response = await fetch(`/api/routes?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch routes')
      }
      const data = await response.json()
      setRoutes(data)
      setFilteredRoutes(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching routes:', error)
      setError('Failed to load routes. Please try again.')
      showToast('Failed to load routes', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ height: '2rem', width: '200px', backgroundColor: '#e5e7eb', borderRadius: '6px', marginBottom: '1rem' }} />
            <div style={{ height: '1rem', width: '400px', backgroundColor: '#e5e7eb', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <div style={{ height: '1.5rem', width: '200px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '0.5rem' }} />
                <div style={{ height: '1rem', width: '300px', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Delivery Routes</h1>
        <Link
          href="/routes/new"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            fontWeight: '500',
          }}
        >
          Create Route
        </Link>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <SearchBar
          placeholder="Search by route name, city, area..."
          onSearch={setSearchQuery}
        />
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          <option value="">All Cities</option>
          <option value="LAGOS">Lagos</option>
          <option value="ABUJA">Abuja</option>
        </select>
      </div>

      {error && (
        <div style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fee2e2', 
            color: '#991b1b', 
            borderRadius: '6px',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
          <button
            onClick={() => {
              setError(null)
              fetchRoutes()
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {route.name}
                </h2>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {route.city} • {route.dayOfWeek} {route.area ? `• ${route.area}` : ''}
                </div>
              </div>
              <div>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    backgroundColor: route.isActive ? '#10b98120' : '#6b728020',
                    color: route.isActive ? '#10b981' : '#6b7280',
                    fontWeight: '500',
                  }}
                >
                  {route.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong>{route.customers.length}</strong> customer{route.customers.length !== 1 ? 's' : ''} on route
            </div>

            {route.customers.length > 0 && (
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: '600' }}>#</div>
                  <div style={{ fontWeight: '600' }}>Customer</div>
                  <div style={{ fontWeight: '600' }}>Area</div>
                </div>
                {route.customers.slice(0, 5).map((rc) => (
                  <div key={rc.customer.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '0.5rem' }}>
                    <div>{rc.sequence}.</div>
                    <div>{rc.customer.name}</div>
                    <div>{rc.customer.area || '-'}</div>
                  </div>
                ))}
                {route.customers.length > 5 && (
                  <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                    +{route.customers.length - 5} more...
                  </div>
                )}
              </div>
            )}

            <Link
              href={`/routes/${route.id}`}
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                fontSize: '0.875rem',
              }}
            >
              View Route Details →
            </Link>
          </div>
        ))}
      </div>

      {!error && filteredRoutes.length === 0 && routes.length === 0 && (
        <EmptyState
          title="No routes yet"
          description="Create delivery routes to organize customers by area and delivery day for efficient distribution."
          actionLabel="Create Route"
          actionHref="/routes/new"
          icon="🗺️"
        />
      )}
      {!error && filteredRoutes.length === 0 && routes.length > 0 && (
        <EmptyState
          title="No routes match your search"
          description={`No routes found matching "${searchQuery}". Try adjusting your search or filters.`}
          icon="🔍"
        />
      )}
    </div>
  )
}
