'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading orders...</div>
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
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
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
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
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

        {orders.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            No orders yet.
          </div>
        )}
      </div>
    </div>
  )
}
