'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface OrderItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Payment {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: string | null
  reference: string | null
  notes: string | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  paymentStatus: string
  deliveryDate: string | null
  notes: string | null
  createdAt: string
  customer: {
    id: string
    name: string
    phone: string
    address: string | null
  }
  items: OrderItem[]
  payments: Payment[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    reference: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/orders/${params.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentForm,
          amount: parseFloat(paymentForm.amount),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add payment')
      }

      setShowPaymentForm(false)
      setPaymentForm({
        amount: '',
        paymentMethod: 'Cash',
        reference: '',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0],
      })
      fetchOrder()
    } catch (error) {
      alert('Failed to add payment')
    }
  }

  const handleUpdateStatus = async (field: 'status' | 'paymentStatus', value: string) => {
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      fetchOrder()
    } catch (error) {
      alert('Failed to update order')
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  if (!order) {
    return <div style={{ padding: '2rem' }}>Order not found</div>
  }

  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = order.totalAmount - totalPaid
  const paymentProgress = order.totalAmount > 0 ? (totalPaid / order.totalAmount) * 100 : 0

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
        <Link
          href="/orders"
          style={{ color: '#3b82f6', textDecoration: 'underline', marginBottom: '1rem', display: 'inline-block' }}
        >
          ← Back to Orders
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
          Order #{order.orderNumber}
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
            Order Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <strong>Status:</strong>
              <select
                value={order.status}
                onChange={(e) => handleUpdateStatus('status', e.target.value)}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                }}
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <strong>Total Amount:</strong> ₦{order.totalAmount.toLocaleString()}
            </div>
            <div>
              <strong>Payment Status:</strong>
              <select
                value={order.paymentStatus}
                onChange={(e) => handleUpdateStatus('paymentStatus', e.target.value)}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                }}
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="WRITTEN_OFF">Written Off</option>
              </select>
            </div>
            {order.deliveryDate && (
              <div>
                <strong>Delivery Date:</strong> {new Date(order.deliveryDate).toLocaleDateString()}
              </div>
            )}
            <div>
              <strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}
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
            Customer Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <strong>Name:</strong> {order.customer.name}
            </div>
            <div>
              <strong>Phone:</strong> {order.customer.phone}
            </div>
            {order.customer.address && (
              <div>
                <strong>Address:</strong> {order.customer.address}
              </div>
            )}
            <Link
              href={`/customers/${order.customer.id}`}
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                fontSize: '0.875rem',
              }}
            >
              View Customer →
            </Link>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Order Items
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Product</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Quantity</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Unit Price</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.75rem' }}>{item.productName}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>₦{item.unitPrice.toLocaleString()}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>₦{item.totalPrice.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Total:</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                ₦{order.totalAmount.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Progress */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Payment Progress
        </h2>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Paid: ₦{totalPaid.toLocaleString()}</span>
            <span>Remaining: ₦{remaining.toLocaleString()}</span>
          </div>
          <div style={{
            width: '100%',
            height: '24px',
            backgroundColor: '#e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div
              style={{
                width: `${paymentProgress}%`,
                height: '100%',
                backgroundColor: paymentProgress === 100 ? '#10b981' : '#3b82f6',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
        <button
          onClick={() => setShowPaymentForm(!showPaymentForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '6px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {showPaymentForm ? 'Cancel' : 'Add Payment'}
        </button>

        {showPaymentForm && (
          <form onSubmit={handleAddPayment} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Amount *</label>
              <input
                type="number"
                required
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Payment Method</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                }}
              >
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
                <option value="POS">POS</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reference</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '6px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Record Payment
            </button>
          </form>
        )}
      </div>

      {/* Payment History */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
          Payment History ({order.payments.length})
        </h2>
        {order.payments.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No payments recorded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Method</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {order.payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem' }}>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>₦{payment.amount.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem' }}>{payment.paymentMethod || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{payment.reference || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
