'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/today', label: 'Today' },
    { href: '/leads', label: 'Leads' },
    { href: '/customers', label: 'Customers' },
    { href: '/orders', label: 'Orders' },
    { href: '/routes', label: 'Routes' },
    { href: '/suppliers', label: 'Suppliers' },
    { href: '/products', label: 'Products' },
    { href: '/businesses', label: 'Businesses' },
    { href: '/follow-ups', label: 'Follow-ups' },
    { href: '/templates', label: 'Templates' },
    { href: '/imports', label: 'Imports' },
    { href: '/scrapers', label: 'Scrapers' },
    { href: '/analytics', label: 'Analytics' },
  ]

  return (
    <nav
      style={{
        width: '220px',
        minWidth: '220px',
        backgroundColor: '#1f2937',
        color: 'white',
        borderRight: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: '1rem',
          fontWeight: 'bold',
          color: 'white',
          textDecoration: 'none',
          padding: '1.25rem 1rem',
          borderBottom: '1px solid #374151',
          flexShrink: 0,
        }}
      >
        Beverage Distribution CRM
      </Link>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 0',
        }}
      >
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/' && pathname?.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'block',
                color: isActive ? '#60a5fa' : '#d1d5db',
                textDecoration: 'none',
                padding: '0.6rem 1rem',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '400',
                backgroundColor: isActive ? '#374151' : 'transparent',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#9ca3af'
                  e.currentTarget.style.backgroundColor = '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#d1d5db'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #374151' }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.6rem 1rem',
            color: '#9ca3af',
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
