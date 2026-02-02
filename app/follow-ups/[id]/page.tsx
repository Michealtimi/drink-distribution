'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ToastContainer, { useToast } from '../../components/Toast'
import LoadingSkeleton from '../../components/LoadingSkeleton'

interface FollowUp {
  id: string
  scheduledFor: string
  completed: boolean
  completedAt: string | null
  message: string | null
  notes: string | null
  lead: {
    id: string
    name: string
    phone: string
  }
}

export default function FollowUpDetailPage() {
  const params = useParams()
  const { toasts, showToast, removeToast } = useToast()
  const [followUp, setFollowUp] = useState<FollowUp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFollowUp()
  }, [params.id])

  const fetchFollowUp = async () => {
    try {
      const response = await fetch(`/api/follow-ups?leadId=${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch follow-up')
      }
      const data = await response.json()
      const found = data.find((fu: FollowUp) => fu.id === params.id)
      if (!found) {
        throw new Error('Follow-up not found')
      }
      setFollowUp(found)
    } catch (error) {
      console.error('Error fetching follow-up:', error)
      showToast('Failed to load follow-up', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <LoadingSkeleton rows={8} columns={2} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  if (!followUp) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <p>Follow-up not found</p>
        <Link href="/follow-ups">Back to Follow-ups</Link>
      </div>
    )
  }

  const isOverdue = !followUp.completed && new Date(followUp.scheduledFor) < new Date()

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/follow-ups"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          ← Back to Follow-ups
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          Follow-up Details
        </h1>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Lead</div>
            <Link
              href={`/leads/${followUp.lead.id}`}
              style={{
                fontWeight: '500',
                color: '#3b82f6',
                textDecoration: 'underline',
              }}
            >
              {followUp.lead.name}
            </Link>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Phone</div>
            <div style={{ fontWeight: '500' }}>{followUp.lead.phone}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Scheduled For</div>
            <div style={{ fontWeight: '500' }}>
              {new Date(followUp.scheduledFor).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Status</div>
            {followUp.completed ? (
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '500',
                backgroundColor: '#d1fae5',
                color: '#065f46',
              }}>
                Completed
              </span>
            ) : isOverdue ? (
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '500',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
              }}>
                Overdue
              </span>
            ) : (
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '500',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
              }}>
                Pending
              </span>
            )}
          </div>
          {followUp.completed && followUp.completedAt && (
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Completed At</div>
              <div style={{ fontWeight: '500' }}>
                {new Date(followUp.completedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {followUp.message && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Message</div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              whiteSpace: 'pre-wrap',
            }}>
              {followUp.message}
            </div>
          </div>
        )}

        {followUp.notes && (
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Notes</div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              whiteSpace: 'pre-wrap',
            }}>
              {followUp.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
