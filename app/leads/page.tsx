'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ToastContainer, { useToast, Toast } from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  area: string | null
  city: string
  category: string
  status: string
  hasWhatsApp: boolean
  source: string | null
  createdAt: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCity, setFilterCity] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('priority')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [validating, setValidating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchLeads()
    fetchLeadCounts()
  }, [filterStatus, filterCity, filterCategory, sortBy, sortOrder])

  // Filter leads by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLeads(leads)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = leads.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(query) ||
        (lead.phone && lead.phone.includes(query)) ||
        (lead.email && lead.email.toLowerCase().includes(query)) ||
        (lead.address && lead.address.toLowerCase().includes(query)) ||
        (lead.area && lead.area.toLowerCase().includes(query))
      )
    })
    setFilteredLeads(filtered)
  }, [searchQuery, leads])

  const fetchLeadCounts = async () => {
    try {
      const response = await fetch('/api/leads')
      const allLeads = await response.json()
      const counts: Record<string, number> = {}
      allLeads.forEach((lead: Lead) => {
        counts[lead.status] = (counts[lead.status] || 0) + 1
      })
      setLeadCounts(counts)
    } catch (error) {
      console.error('Error fetching lead counts:', error)
    }
  }

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterCity) params.append('city', filterCity)
      if (filterCategory) params.append('category', filterCategory)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/leads?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }
      const data = await response.json()
      setLeads(data)
      setFilteredLeads(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching leads:', error)
      setError('Failed to load leads. Please try again.')
      showToast('Failed to load leads', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewScrapedLeads = () => {
    setFilterStatus('SCRAPED')
  }

  const handleAutoValidate = async () => {
    setValidating(true)
    try {
      const response = await fetch('/api/leads/validate', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        showToast(
          `Validation complete: ${result.verified} verified, ${result.invalid} invalid`,
          'success'
        )
        fetchLeads() // Refresh the list
        fetchLeadCounts()
      } else {
        showToast('Validation failed: ' + (result.error || 'Unknown error'), 'error')
      }
    } catch (error) {
      console.error('Error validating leads:', error)
      showToast('Failed to validate leads', 'error')
    } finally {
      setValidating(false)
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return
    }

    setDeleting(leadId)
    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
      if (response.ok) {
        showToast('Lead deleted successfully', 'success')
        fetchLeads()
        fetchLeadCounts()
        setSelectedLeads(new Set())
      } else {
        showToast('Failed to delete lead', 'error')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      showToast('Failed to delete lead', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) {
      showToast('Please select leads to delete', 'warning')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedLeads.size} lead(s)?`)) {
      return
    }

    setDeleting('bulk')
    try {
      const deletePromises = Array.from(selectedLeads).map((leadId) =>
        fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
      )
      await Promise.all(deletePromises)
      showToast(`Successfully deleted ${selectedLeads.size} lead(s)`, 'success')
      fetchLeads()
      fetchLeadCounts()
      setSelectedLeads(new Set())
    } catch (error) {
      console.error('Error deleting leads:', error)
      showToast('Failed to delete some leads', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)))
    }
  }

  const statusColors: Record<string, string> = {
    SCRAPED: '#9ca3af',
    UNVERIFIED: '#f59e0b',
    VERIFIED: '#3b82f6',
    MESSAGED: '#8b5cf6',
    INTERESTED: '#10b981',
    CUSTOMER: '#059669',
    REPEAT_CUSTOMER: '#047857',
    INVALID: '#ef4444',
  }

  if (loading) {
    return (
      <>
        <LoadingSkeleton rows={8} columns={10} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Leads</h1>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <span>
              <strong style={{ color: '#9ca3af' }}>Scraped:</strong> {leadCounts.SCRAPED || 0}
            </span>
            <span>
              <strong style={{ color: '#f59e0b' }}>Unverified:</strong> {leadCounts.UNVERIFIED || 0}
            </span>
            <span>
              <strong style={{ color: '#3b82f6' }}>Verified:</strong> {leadCounts.VERIFIED || 0}
            </span>
            <span>
              <strong style={{ color: '#ef4444' }}>Invalid:</strong> {leadCounts.INVALID || 0}
            </span>
            <span>
              <strong>Total:</strong> {leads.length}
              {searchQuery && (
                <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                  ({filteredLeads.length} matching)
                </span>
              )}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {selectedLeads.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting === 'bulk'}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: deleting === 'bulk' ? '#9ca3af' : '#ef4444',
                color: 'white',
                borderRadius: '6px',
                fontWeight: '500',
                border: 'none',
                cursor: deleting === 'bulk' ? 'not-allowed' : 'pointer',
              }}
            >
              {deleting === 'bulk' ? 'Deleting...' : `Delete Selected (${selectedLeads.size})`}
            </button>
          )}
          <button
            onClick={handleViewScrapedLeads}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: filterStatus === 'SCRAPED' ? '#6366f1' : '#8b5cf6',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            View Scraped Leads {leadCounts.SCRAPED ? `(${leadCounts.SCRAPED})` : ''}
          </button>
          <button
            onClick={handleAutoValidate}
            disabled={validating}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: validating ? '#9ca3af' : '#10b981',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              border: 'none',
              cursor: validating ? 'not-allowed' : 'pointer',
            }}
          >
            {validating ? 'Validating...' : 'Auto-Validate All'}
          </button>
          <Link
            href="/leads/new"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            Add Lead
          </Link>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <SearchBar
          placeholder="Search by name, phone, email, address..."
          onSearch={setSearchQuery}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          <option value="">All Statuses</option>
          <option value="SCRAPED">Scraped</option>
          <option value="UNVERIFIED">Unverified</option>
          <option value="VERIFIED">Verified</option>
          <option value="MESSAGED">Messaged</option>
          <option value="INTERESTED">Interested</option>
          <option value="CUSTOMER">Customer</option>
          <option value="REPEAT_CUSTOMER">Repeat Customer</option>
          <option value="INVALID">Invalid</option>
        </select>

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
          <option value="GYM">Gym</option>
          <option value="EVENT_CENTER">Event Center</option>
          <option value="CLUB">Club</option>
          <option value="LOUNGE">Lounge</option>
          <option value="OFFICE">Office</option>
          <option value="SMALL_RETAILER">Small Retailer</option>
          <option value="OTHER">Other</option>
        </select>

        <span style={{ marginLeft: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          <option value="priority">Priority Order</option>
          <option value="createdAt">Date Created</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
          <option value="city">City</option>
          <option value="category">Category</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
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
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Phone</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Area</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>City</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Source</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: selectedLeads.has(lead.id) ? '#eff6ff' : 'white',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!selectedLeads.has(lead.id)) {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedLeads.has(lead.id)) {
                    e.currentTarget.style.backgroundColor = 'white'
                  }
                }}
              >
                <td style={{ padding: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => handleSelectLead(lead.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>{lead.name}</td>
                <td style={{ padding: '1rem' }}>
                  {lead.phone && lead.phone !== 'NO_PHONE' ? lead.phone : '-'}
                </td>
                <td style={{ padding: '1rem' }}>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {lead.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ padding: '1rem' }}>{lead.area || '-'}</td>
                <td style={{ padding: '1rem' }}>{lead.city}</td>
                <td style={{ padding: '1rem' }}>{lead.category.replace('_', ' ')}</td>
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      backgroundColor: `${statusColors[lead.status]}20`,
                      color: statusColors[lead.status],
                      fontWeight: '500',
                    }}
                  >
                    {lead.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {lead.source || '-'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link
                      href={`/leads/${lead.id}`}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                      }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      disabled={deleting === lead.id}
                      style={{
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: deleting === lead.id ? 'not-allowed' : 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                        padding: 0,
                      }}
                    >
                      {deleting === lead.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
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
                fetchLeads()
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
        {!error && filteredLeads.length === 0 && leads.length === 0 && (
          <EmptyState
            title="No leads yet"
            description="Start building your lead pipeline by adding your first lead or running a scraper."
            actionLabel="Add Lead"
            actionHref="/leads/new"
            icon="📋"
          />
        )}
        {!error && filteredLeads.length === 0 && leads.length > 0 && (
          <EmptyState
            title="No leads match your search"
            description={`No leads found matching "${searchQuery}". Try adjusting your search or filters.`}
            icon="🔍"
          />
        )}
      </div>
    </div>
  )
}
