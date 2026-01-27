'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import BackButton from '../../components/BackButton'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  paymentStatus: string
  deliveryDate: string | null
  createdAt: string
  items: any[]
  payments: any[]
}

interface Customer {
  id: string
  name: string
  phone: string
  address: string | null
  area: string | null
  city: string
  category: string
  deliveryDay: string | null
  orders: Order[]
}

export default function CustomerDetailPage() {
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCustomer()
    }
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`)
      const data = await response.json()
      setCustomer(data)
    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  if (!customer) {
    return <div style={{ padding: '2rem' }}>Customer not found</div>
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <BackButton href="/customers" label="Back to Customers" />
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
          {customer.name}
        </h1>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Contact Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><strong>Phone:</strong> {customer.phone}</div>
            {customer.address && <div><strong>Address:</strong> {customer.address}</div>}
            {customer.area && <div><strong>Area:</strong> {customer.area}</div>}
            <div><strong>City:</strong> {customer.city}</div>
            <div><strong>Category:</strong> {customer.category.replace('_', ' ')}</div>
            {customer.deliveryDay && <div><strong>Delivery Day:</strong> {customer.deliveryDay}</div>}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              href={`/orders/new?customerId=${customer.id}`}
              style={{
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                fontWeight: '500',
                textAlign: 'center',
                display: 'block',
              }}
            >
              Create Order
            </Link>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Orders ({customer.orders.length})
        </h2>
        {customer.orders.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No orders yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {customer.orders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <strong>Order #{order.orderNumber}</strong>
                    <span
                      style={{
                        marginLeft: '1rem',
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
                    <span
                      style={{
                        marginLeft: '0.5rem',
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
                  </div>
                  <div>
                    <strong>₦{order.totalAmount.toLocaleString()}</strong>
                  </div>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {order.items.length} item(s) • Created {new Date(order.createdAt).toLocaleDateString()}
                  {order.deliveryDate && ` • Delivery: ${new Date(order.deliveryDate).toLocaleDateString()}`}
                </div>
                <Link
                  href={`/orders/${order.id}`}
                  style={{
                    marginTop: '0.5rem',
                    display: 'inline-block',
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    fontSize: '0.875rem',
                  }}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
