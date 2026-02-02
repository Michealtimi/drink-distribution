'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Home' },
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
    <nav style={{
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '1rem 2rem',
      borderBottom: '1px solid #374151',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Link
          href="/"
          style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'white',
            textDecoration: 'none',
          }}
        >
          Beverage Distribution CRM
        </Link>

        <div style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
        }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || 
              (link.href !== '/' && pathname?.startsWith(link.href))
            
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#60a5fa' : '#d1d5db',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: isActive ? '#374151' : 'transparent',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? '600' : '400',
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
      </div>
    </nav>
  )
}
