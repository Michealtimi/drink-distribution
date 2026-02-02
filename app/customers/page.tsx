'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ToastContainer, { useToast } from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

interface Customer {
  id: string
  name: string
  phone: string
  area: string | null
  city: string
  category: string
  deliveryDay: string | null
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCity, setFilterCity] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [filterCity])

  // Filter customers by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        (customer.area && customer.area.toLowerCase().includes(query))
      )
    })
    setFilteredCustomers(filtered)
  }, [searchQuery, customers])

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCity) params.append('city', filterCity)

      const response = await fetch(`/api/customers?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }
      const data = await response.json()
      setCustomers(data)
      setFilteredCustomers(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError('Failed to load customers. Please try again.')
      showToast('Failed to load customers', 'error')
    } finally {
      setLoading(false)
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
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
        Customers
      </h1>

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <SearchBar
          placeholder="Search by name, phone, area..."
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

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Phone</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Area</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>City</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Delivery Day</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr 
                key={customer.id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                <td style={{ padding: '1rem' }}>{customer.name}</td>
                <td style={{ padding: '1rem' }}>{customer.phone}</td>
                <td style={{ padding: '1rem' }}>{customer.area || '-'}</td>
                <td style={{ padding: '1rem' }}>{customer.city}</td>
                <td style={{ padding: '1rem' }}>{customer.category.replace('_', ' ')}</td>
                <td style={{ padding: '1rem' }}>{customer.deliveryDay || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <Link
                    href={`/customers/${customer.id}`}
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

        {error && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
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
                fetchCustomers()
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
        {!error && filteredCustomers.length === 0 && customers.length === 0 && (
          <EmptyState
            title="No customers yet"
            description="Convert interested leads to customers to start managing orders and deliveries."
            actionLabel="View Leads"
            actionHref="/leads"
            icon="👥"
          />
        )}
        {!error && filteredCustomers.length === 0 && customers.length > 0 && (
          <EmptyState
            title="No customers match your search"
            description={`No customers found matching "${searchQuery}". Try adjusting your search or filters.`}
            icon="🔍"
          />
        )}
      </div>
    </div>
  )
}
