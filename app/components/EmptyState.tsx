'use client'

import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  icon?: string
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon = '📋',
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    >
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
    </div>
  )
}
