'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import BackButton from '../../components/BackButton'

interface Lead {
  id: string
  name: string
  phone: string
  address: string | null
  area: string | null
  city: string
  category: string
  status: string
  hasWhatsApp: boolean
  source: string | null
  notes: string | null
  createdAt: string
  customer: any
}

interface MessageData {
  message: string
  whatsappLink: string
  phone: string
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageData, setMessageData] = useState<MessageData | null>(null)
  const [showMessage, setShowMessage] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchLead()
    }
  }, [params.id])

  const fetchLead = async () => {
    try {
      const response = await fetch(`/api/leads/${params.id}`)
      const data = await response.json()
      setLead(data)
    } catch (error) {
      console.error('Error fetching lead:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMessage = async () => {
    try {
      const response = await fetch(`/api/leads/${params.id}/message`)
      const data = await response.json()
      setMessageData(data)
      setShowMessage(true)
    } catch (error) {
      console.error('Error generating message:', error)
    }
  }

  const copyMessage = () => {
    if (messageData) {
      navigator.clipboard.writeText(messageData.message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await response.json()
      setLead(data)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const convertToCustomer = async () => {
    try {
      const response = await fetch(`/api/leads/${params.id}/convert`, {
        method: 'POST',
      })
      const data = await response.json()
      router.push(`/customers/${data.id}`)
    } catch (error) {
      console.error('Error converting lead:', error)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  if (!lead) {
    return <div style={{ padding: '2rem' }}>Lead not found</div>
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <BackButton href="/leads" label="Back to Leads" />
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
          {lead.name}
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
            <div>
              <strong>Phone:</strong> {lead.phone}
            </div>
            {lead.address && (
              <div>
                <strong>Address:</strong> {lead.address}
              </div>
            )}
            {lead.area && (
              <div>
                <strong>Area:</strong> {lead.area}
              </div>
            )}
            <div>
              <strong>City:</strong> {lead.city}
            </div>
            <div>
              <strong>Category:</strong> {lead.category.replace('_', ' ')}
            </div>
            {lead.source && (
              <div>
                <strong>Source:</strong> {lead.source}
              </div>
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Status & Actions
          </h2>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong>
            <span
              style={{
                marginLeft: '0.5rem',
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={generateMessage}
              style={{
                padding: '0.75rem',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '6px',
                fontWeight: '500',
                textAlign: 'left',
              }}
            >
              Generate Message
            </button>

            <select
              value={lead.status}
              onChange={(e) => updateStatus(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
              }}
            >
              <option value="SCRAPED">Scraped</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="VERIFIED">Verified</option>
              <option value="MESSAGED">Messaged</option>
              <option value="INTERESTED">Interested</option>
              <option value="CUSTOMER">Customer</option>
              <option value="REPEAT_CUSTOMER">Repeat Customer</option>
              <option value="INVALID">Invalid</option>
            </select>

            {lead.status === 'INTERESTED' && !lead.customer && (
              <button
                onClick={convertToCustomer}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: '500',
                }}
              >
                Convert to Customer
              </button>
            )}

            {lead.customer && (
              <Link
                href={`/customers/${lead.customer.id}`}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: '500',
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                View Customer
              </Link>
            )}
          </div>
        </div>
      </div>

      {showMessage && messageData && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          marginBottom: '2rem',
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Generated Message
          </h2>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            marginBottom: '1rem',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
          }}>
            {messageData.message}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={copyMessage}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                borderRadius: '6px',
                fontWeight: '500',
              }}
            >
              {copied ? 'Copied!' : 'Copy Message'}
            </button>
            <a
              href={messageData.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#25d366',
                color: 'white',
                borderRadius: '6px',
                fontWeight: '500',
                display: 'inline-block',
              }}
            >
              Open WhatsApp
            </a>
          </div>
        </div>
      )}

      {lead.notes && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Notes
          </h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
        </div>
      )}
    </div>
  )
}
