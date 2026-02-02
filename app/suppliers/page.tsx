'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ToastContainer, { useToast } from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

interface Supplier {
  id: string
  name: string
  contactName: string | null
  phone: string
  email: string | null
  city: string | null
  isActive: boolean
  productList: Array<{ id: string; name: string; category: string }>
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCity, setFilterCity] = useState<string>('')
  const [filterActive, setFilterActive] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchSuppliers()
  }, [filterCity, filterActive])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuppliers(suppliers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = suppliers.filter((supplier) => {
      return (
        supplier.name.toLowerCase().includes(query) ||
        supplier.phone.includes(query) ||
        (supplier.contactName && supplier.contactName.toLowerCase().includes(query)) ||
        (supplier.email && supplier.email.toLowerCase().includes(query))
      )
    })
    setFilteredSuppliers(filtered)
  }, [searchQuery, suppliers])

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCity) params.append('city', filterCity)
      if (filterActive) params.append('isActive', filterActive)

      const response = await fetch(`/api/suppliers?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }
      const data = await response.json()
      setSuppliers(data)
      setFilteredSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      showToast('Failed to load suppliers', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete supplier')
      }

      showToast('Supplier deleted successfully', 'success')
      fetchSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      showToast('Failed to delete supplier', 'error')
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
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Suppliers</h1>
        <Link
          href="/suppliers/new"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Add Supplier
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
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
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
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Contact</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Phone</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>City</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Products</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr 
                key={supplier.id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <td style={{ padding: '1rem' }}>{supplier.name}</td>
                <td style={{ padding: '1rem' }}>{supplier.contactName || '-'}</td>
                <td style={{ padding: '1rem' }}>{supplier.phone}</td>
                <td style={{ padding: '1rem' }}>{supplier.city || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  {supplier.productList.length > 0 
                    ? `${supplier.productList.length} product(s)`
                    : '-'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: supplier.isActive ? '#d1fae5' : '#fee2e2',
                    color: supplier.isActive ? '#065f46' : '#991b1b',
                  }}>
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/suppliers/${supplier.id}`}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                      }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(supplier.id, supplier.name)}
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

        {filteredSuppliers.length === 0 && suppliers.length === 0 && (
          <EmptyState
            title="No suppliers yet"
            description="Add suppliers to track your product sources."
            actionLabel="Add Supplier"
            actionHref="/suppliers/new"
            icon="🏭"
          />
        )}
        {filteredSuppliers.length === 0 && suppliers.length > 0 && (
          <EmptyState
            title="No suppliers match your search"
            description={`No suppliers found matching "${searchQuery}". Try adjusting your search or filters.`}
            icon="🔍"
          />
        )}
      </div>
    </div>
  )
}
