'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ToastContainer, { useToast } from '../components/Toast'
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
  const searchParams = useSearchParams()
  const [filterStatus, setFilterStatus] = useState<string>(() => searchParams.get('status') ?? '')
  const [filterCity, setFilterCity] = useState<string>(() => searchParams.get('city') ?? '')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('priority')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [validating, setValidating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [bulkMarking, setBulkMarking] = useState(false)

  // Sync URL when filters change so dashboard "View Leads" opens with right filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (filterStatus) params.set('status', filterStatus)
    else params.delete('status')
    if (filterCity) params.set('city', filterCity)
    else params.delete('city')
    const qs = params.toString()
    const newPath = `${window.location.pathname}${qs ? `?${qs}` : ''}`
    if (window.location.pathname + (window.location.search || '') !== newPath) {
      window.history.replaceState(null, '', newPath)
    }
  }, [filterStatus, filterCity])

  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchLeads()
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

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterCity) params.append('city', filterCity)
      if (filterCategory) params.append('category', filterCategory)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('limit', '500')
      params.append('includeCounts', 'true')

      const response = await fetch(`/api/leads?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }
      const json = await response.json()
      const data = Array.isArray(json) ? json : (json.data ?? [])
      setLeads(data)
      setFilteredLeads(data)
      if (json.counts != null) setLeadCounts(json.counts)
      setError(null)
    } catch (error) {
      console.error('Error fetching leads:', error)
      setError('Failed to load leads. Please try again.')
      showToast('Failed to load leads', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoValidate = async () => {
    setValidating(true)
    try {
      const response = await fetch('/api/leads/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      if (result.success) {
        showToast(result.message || `Validated: ${result.verified} verified, ${result.invalid} invalid`, 'success')
        fetchLeads()
      } else {
        showToast(result.message || result.error || 'Validation failed', 'error')
      }
    } catch (error) {
      console.error('Error validating leads:', error)
      showToast('Failed to validate leads', 'error')
    } finally {
      setValidating(false)
    }
  }

  const handleValidateSelected = async () => {
    if (selectedLeads.size === 0) {
      showToast('Select at least one lead to validate', 'warning')
      return
    }
    setValidating(true)
    try {
      const response = await fetch('/api/leads/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [...selectedLeads] }),
      })
      const result = await response.json()
      if (result.success) {
        showToast(result.message || `Validated ${result.validated}: ${result.verified} verified, ${result.invalid} invalid`, 'success')
        setSelectedLeads(new Set())
        fetchLeads()
      } else {
        showToast(result.error || 'Validation failed', 'error')
      }
    } catch (error) {
      console.error('Error validating selected:', error)
      showToast('Failed to validate selected leads', 'error')
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
      setSelectedLeads(new Set())
    } catch (error) {
      console.error('Error deleting leads:', error)
      showToast('Failed to delete some leads', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleExportCsv = () => {
    const params = new URLSearchParams()
    params.set('format', 'csv')
    if (filterStatus) params.set('status', filterStatus)
    if (filterCity) params.set('city', filterCity)
    if (filterCategory) params.set('category', filterCategory)
    const url = `/api/leads/export?${params.toString()}`
    window.open(url, '_blank', 'noopener,noreferrer')
    showToast('Export started. File will download shortly.', 'success')
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
    const list = filteredLeads
    if (selectedLeads.size === list.length && list.length > 0) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(list.map((l) => l.id)))
    }
  }

  const selectedVerifiedCount = useMemo(() => {
    return filteredLeads.filter((l) => selectedLeads.has(l.id) && l.status === 'VERIFIED').length
  }, [filteredLeads, selectedLeads])

  const handleBulkMarkAsMessaged = async () => {
    if (selectedVerifiedCount === 0) {
      showToast('Select Verified leads to mark as messaged', 'warning')
      return
    }
    setBulkMarking(true)
    try {
      const res = await fetch('/api/leads/bulk-mark-messaged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [...selectedLeads] }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data?.error || 'Failed to mark as messaged', 'error')
        return
      }
      showToast(data.message || `${data.updated} lead(s) marked as messaged. Follow-ups scheduled.`, 'success')
      setSelectedLeads(new Set())
      fetchLeads()
    } catch {
      showToast('Failed to mark as messaged', 'error')
    } finally {
      setBulkMarking(false)
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Leads</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Click a tab to filter by status. Sort with the dropdowns. Use Auto-Validate to score Scraped/Unverified leads into Verified or Invalid.
        </p>
        {/* Status tabs: click to filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { value: '', label: 'All', count: Object.keys(leadCounts).length ? Object.values(leadCounts).reduce((a, b) => a + b, 0) : leads.length, tooltip: 'All leads' },
            { value: 'SCRAPED', label: 'Scraped', count: leadCounts.SCRAPED || 0, color: '#9ca3af', tooltip: 'Just imported; run Validate to verify' },
            { value: 'UNVERIFIED', label: 'Unverified', count: leadCounts.UNVERIFIED || 0, color: '#f59e0b', tooltip: 'Not yet validated; run Auto-Validate' },
            { value: 'VERIFIED', label: 'Verified', count: leadCounts.VERIFIED || 0, color: '#3b82f6', tooltip: 'Ready to message – open lead → Generate message → WhatsApp' },
            { value: 'MESSAGED', label: 'Messaged', count: leadCounts.MESSAGED || 0, color: '#8b5cf6', tooltip: 'First WhatsApp sent; follow-ups scheduled' },
            { value: 'INTERESTED', label: 'Interested', count: leadCounts.INTERESTED || 0, color: '#10b981', tooltip: 'Showed interest; can convert to Customer' },
            { value: 'CUSTOMER', label: 'Customer', count: leadCounts.CUSTOMER || 0, color: '#059669', tooltip: 'Converted from lead' },
            { value: 'REPEAT_CUSTOMER', label: 'Repeat', count: leadCounts.REPEAT_CUSTOMER || 0, color: '#047857', tooltip: 'Repeat customer' },
            { value: 'INVALID', label: 'Invalid', count: leadCounts.INVALID || 0, color: '#ef4444', tooltip: 'Invalid or no WhatsApp; skip or remove' },
          ].map(({ value, label, count, color, tooltip }) => (
            <button
              key={value || 'all'}
              type="button"
              title={tooltip}
              onClick={() => setFilterStatus(value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: filterStatus === value ? `2px solid ${color || '#374151'}` : '1px solid #e5e7eb',
                backgroundColor: filterStatus === value ? (color ? `${color}18` : '#f3f4f6') : '#fff',
                color: color || '#374151',
                fontWeight: filterStatus === value ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {filterStatus ? `Showing ${filteredLeads.length} ${filterStatus.replace('_', ' ').toLowerCase()} lead(s)` : `Showing ${filteredLeads.length} lead(s)`}
          {searchQuery && ` (filtered by search)`}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedLeads.size > 0 && (
            <>
              {selectedVerifiedCount > 0 && (
                <button
                  onClick={handleBulkMarkAsMessaged}
                  disabled={bulkMarking}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: bulkMarking ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: bulkMarking ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bulkMarking ? 'Updating…' : `Mark as messaged (${selectedVerifiedCount})`}
                </button>
              )}
              <button
                onClick={handleValidateSelected}
                disabled={validating}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: validating ? '#9ca3af' : '#10b981',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: validating ? 'not-allowed' : 'pointer',
                }}
              >
                {validating ? 'Validating...' : `Validate Selected (${selectedLeads.size})`}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting === 'bulk'}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: deleting === 'bulk' ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: deleting === 'bulk' ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting === 'bulk' ? 'Deleting...' : `Delete (${selectedLeads.size})`}
              </button>
            </>
          )}
          <button
            onClick={handleExportCsv}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Export CSV
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
            description="Get leads from scrapers or add one manually. Then validate, message, and mark as messaged."
            actionLabel="Go to Scrapers"
            actionHref="/scrapers"
            icon="📋"
            secondaryActionLabel="Add Lead"
            secondaryActionHref="/leads/new"
          />
        )}
        {!error && filteredLeads.length === 0 && leads.length > 0 && searchQuery && (
          <EmptyState
            title="No leads match your search"
            description={`No leads found matching "${searchQuery}". Try adjusting your search.`}
            icon="🔍"
          />
        )}
        {!error && filteredLeads.length === 0 && leads.length > 0 && !searchQuery && filterStatus && (
          <EmptyState
            title={`No ${filterStatus.replace(/_/g, ' ').toLowerCase()} leads`}
            description={
              filterStatus === 'SCRAPED' || filterStatus === 'UNVERIFIED'
                ? 'Run a scraper to get new leads, or click "Auto-Validate All" to move Scraped/Unverified leads into Verified or Invalid.'
                : filterStatus === 'VERIFIED'
                  ? 'Run "Auto-Validate All" on Scraped or Unverified leads to get verified leads here.'
                  : `No leads in this status yet. Use the All tab or other tabs to view leads.`
            }
            icon="📂"
          />
        )}
      </div>
    </div>
  )
}
