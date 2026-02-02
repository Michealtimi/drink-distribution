'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ToastContainer, { useToast } from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

interface Business {
  id: string
  name: string
  phone: string | null
  email: string | null
  area: string | null
  city: string
  category: string
  _count: {
    leads: number
    customers: number
  }
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCity, setFilterCity] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchBusinesses()
  }, [filterCity, filterCategory])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBusinesses(businesses)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = businesses.filter((business) => {
      return (
        business.name.toLowerCase().includes(query) ||
        (business.phone && business.phone.includes(query)) ||
        (business.email && business.email.toLowerCase().includes(query)) ||
        (business.area && business.area.toLowerCase().includes(query))
      )
    })
    setFilteredBusinesses(filtered)
  }, [searchQuery, businesses])

  const fetchBusinesses = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCity) params.append('city', filterCity)
      if (filterCategory) params.append('category', filterCategory)

      const response = await fetch(`/api/businesses?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch businesses')
      }
      const data = await response.json()
      setBusinesses(data)
      setFilteredBusinesses(data)
    } catch (error) {
      console.error('Error fetching businesses:', error)
      showToast('Failed to load businesses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const response = await fetch(`/api/businesses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete business')
      }

      showToast('Business deleted successfully', 'success')
      fetchBusinesses()
    } catch (error) {
      console.error('Error deleting business:', error)
      showToast('Failed to delete business', 'error')
    }
  }

  if (loading) {
    return (
      <>
        <LoadingSkeleton rows={8} columns={7} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Businesses</h1>
        <Link
          href="/businesses/new"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Add Business
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
          placeholder="Search by name, phone, email..."
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
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          <option value="">All Categories</option>
          <option value="DISTRIBUTOR">Distributor</option>
          <option value="SUPPLIER">Supplier</option>
          <option value="CONSUMER">Consumer</option>
          <option value="GYM">Gym</option>
          <option value="EVENT_CENTER">Event Center</option>
          <option value="CLUB">Club</option>
          <option value="LOUNGE">Lounge</option>
          <option value="OFFICE">Office</option>
          <option value="SMALL_RETAILER">Small Retailer</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Phone</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Area</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>City</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Leads/Customers</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBusinesses.map((business) => (
              <tr 
                key={business.id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <td style={{ padding: '1rem' }}>{business.name}</td>
                <td style={{ padding: '1rem' }}>{business.phone || '-'}</td>
                <td style={{ padding: '1rem' }}>{business.area || '-'}</td>
                <td style={{ padding: '1rem' }}>{business.city}</td>
                <td style={{ padding: '1rem' }}>{business.category.replace('_', ' ')}</td>
                <td style={{ padding: '1rem' }}>
                  {business._count.leads} leads, {business._count.customers} customers
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/businesses/${business.id}`}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                      }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(business.id, business.name)}
                      style={{
                        color: '#ef4444',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBusinesses.length === 0 && businesses.length === 0 && (
          <EmptyState
            title="No businesses yet"
            description="Add businesses to group related leads and customers."
            actionLabel="Add Business"
            actionHref="/businesses/new"
            icon="🏢"
          />
        )}
        {filteredBusinesses.length === 0 && businesses.length > 0 && (
          <EmptyState
            title="No businesses match your search"
            description={`No businesses found matching "${searchQuery}". Try adjusting your search or filters.`}
            icon="🔍"
          />
        )}
      </div>
    </div>
  )
}
