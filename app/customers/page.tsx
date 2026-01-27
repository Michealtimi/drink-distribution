'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  const [loading, setLoading] = useState(true)
  const [filterCity, setFilterCity] = useState<string>('')

  useEffect(() => {
    fetchCustomers()
  }, [filterCity])

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCity) params.append('city', filterCity)

      const response = await fetch(`/api/customers?${params.toString()}`)
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading customers...</div>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
        Customers
      </h1>

      <div style={{ marginBottom: '1.5rem' }}>
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
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
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
            {customers.map((customer) => (
              <tr key={customer.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
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

        {customers.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            No customers yet. Convert interested leads to customers.
          </div>
        )}
      </div>
    </div>
  )
}
