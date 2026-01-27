'use client'

import { useState, useEffect } from 'react'

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
}

export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs, onSearch])

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem 2.5rem 0.75rem 1rem',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          fontSize: '0.875rem',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6'
          e.currentTarget.style.outline = 'none'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db'
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#6b7280',
          fontSize: '1rem',
        }}
      >
        🔍
      </div>
      {query && (
        <button
          onClick={() => {
            setQuery('')
            onSearch('')
          }}
          style={{
            position: 'absolute',
            right: '2.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: 0,
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}
