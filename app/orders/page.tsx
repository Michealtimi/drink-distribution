'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ToastContainer, { useToast } from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  paymentStatus: string
  customer: {
    name: string
    phone: string
  }
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter orders by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = orders.filter((order) => {
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.customer.phone.includes(query)
      )
    })
    setFilteredOrders(filtered)
  }, [searchQuery, orders])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()
      setOrders(data)
      setFilteredOrders(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders. Please try again.')
      showToast('Failed to load orders', 'error')
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

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    DELIVERED: '#10b981',
    CANCELLED: '#ef4444',
  }

  const paymentColors: Record<string, string> = {
    PENDING: '#f59e0b',
    PAID: '#10b981',
    OVERDUE: '#ef4444',
    WRITTEN_OFF: '#6b7280',
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
        Orders
      </h1>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 10 }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Order #</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Customer</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Amount</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Payment</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr 
                key={order.id} 
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
                <td style={{ padding: '1rem' }}>{order.orderNumber}</td>
                <td style={{ padding: '1rem' }}>
                  <div>{order.customer.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{order.customer.phone}</div>
                </td>
                <td style={{ padding: '1rem' }}>₦{order.totalAmount.toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      backgroundColor: `${statusColors[order.status]}20`,
                      color: statusColors[order.status],
                      fontWeight: '500',
                    }}
                  >
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      backgroundColor: `${paymentColors[order.paymentStatus]}20`,
                      color: paymentColors[order.paymentStatus],
                      fontWeight: '500',
                    }}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  <Link
                    href={`/orders/${order.id}`}
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
                fetchOrders()
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
        {!error && filteredOrders.length === 0 && orders.length === 0 && (
          <EmptyState
            title="No orders yet"
            description="Orders will appear here once customers place their first orders."
            actionLabel="View Customers"
            actionHref="/customers"
            icon="📦"
          />
        )}
        {!error && filteredOrders.length === 0 && orders.length > 0 && (
          <EmptyState
            title="No orders match your search"
            description={`No orders found matching "${searchQuery}". Try adjusting your search.`}
            icon="🔍"
          />
        )}
      </div>
    </div>
  )
}
