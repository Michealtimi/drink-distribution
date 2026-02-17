'use client'

import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  secondaryActionLabel?: string
  secondaryActionHref?: string
  icon?: string
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  icon = '📋',
}: EmptyStateProps) {
  return (
    <div className="card empty-state">
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{icon}</div>
      <h3
        style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '0.5rem',
          color: '#111827',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '2rem',
          maxWidth: '500px',
          margin: '0 auto 2rem',
        }}
      >
        {description}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
            }}
          >
            {actionLabel}
          </Link>
        )}
        {secondaryActionLabel && secondaryActionHref && (
          <Link
            href={secondaryActionHref}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '6px',
              fontWeight: '500',
              textDecoration: 'none',
              border: '1px solid #d1d5db',
            }}
          >
            {secondaryActionLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
