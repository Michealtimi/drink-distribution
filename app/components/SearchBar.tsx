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
    <div className="search-wrapper">
      <input
        className="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onFocus={(e) => {
          e.currentTarget.classList.add('focus')
        }}
        onBlur={(e) => {
          e.currentTarget.classList.remove('focus')
        }}
      />
      <div className="search-icon">🔍</div>
      {query && (
        <button
          onClick={() => {
            setQuery('')
            onSearch('')
          }}
          className="search-clear"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}
