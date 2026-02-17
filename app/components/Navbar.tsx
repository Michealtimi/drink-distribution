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
    <nav className="app-nav">
      <div className="nav-brand">
        <Link href="/">Beverage Distribution CRM</Link>
      </div>

      <div className="nav-links">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      <div className="nav-footer">
        <button type="button" onClick={handleLogout} className="nav-logout">
          Logout
        </button>
      </div>
    </nav>
  )
}
