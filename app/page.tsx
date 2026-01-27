'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#000000'
    }}>
      {/* Hero Section */}
      <div style={{
        padding: '4rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          marginBottom: '3rem',
        }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            color: '#000000',
            lineHeight: '1.2',
          }}>
            Beverage Distribution CRM
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#333333',
            maxWidth: '700px',
            margin: '0 auto 2rem',
            lineHeight: '1.6',
          }}>
            Streamline your beverage distribution business with automated lead generation, 
            customer management, and route optimization. Built for energy drinks, cognac, 
            and beverage distributors in Lagos and Abuja.
          </p>
        </div>

        {/* Hero Image Placeholder */}
        <div style={{
          width: '100%',
          maxWidth: '800px',
          height: '400px',
          margin: '0 auto 4rem',
          backgroundColor: '#f5f5f5',
          border: '2px solid #000000',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            fontSize: '4rem',
            color: '#000000',
            opacity: 0.3,
          }}>
            📦
          </div>
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            fontSize: '0.875rem',
            color: '#666666',
            fontStyle: 'italic',
          }}>
            Distribution Network Illustration
          </div>
        </div>

        {/* Features Section */}
        <div style={{
          marginTop: '4rem',
          paddingTop: '4rem',
          borderTop: '2px solid #000000',
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            color: '#000000',
          }}>
            Key Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginTop: '2rem',
          }}>
            <div style={{
              padding: '2rem',
              border: '1px solid #000000',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#000000',
              }}>
                Automated Lead Scraping
              </h3>
              <p style={{
                color: '#333333',
                lineHeight: '1.6',
              }}>
                Automatically scrape leads from Google Maps, Instagram, and business directories. 
                Multi-query support for efficient lead generation.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #000000',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#000000',
              }}>
                Customer Management
              </h3>
              <p style={{
                color: '#333333',
                lineHeight: '1.6',
              }}>
                Track leads through the entire sales funnel. Manage customers, orders, 
                and categorize by type (gyms, events, clubs, offices, retailers).
              </p>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #000000',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#000000',
              }}>
                Route Optimization
              </h3>
              <p style={{
                color: '#333333',
                lineHeight: '1.6',
              }}>
                Plan delivery routes by area and day. Group customers efficiently 
                for streamlined distribution operations.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div style={{
          marginTop: '4rem',
          paddingTop: '4rem',
          borderTop: '2px solid #000000',
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            color: '#000000',
          }}>
            Get Started
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem',
          }}>
            <Link 
              href="/scrapers"
              style={{
                padding: '1.5rem',
                backgroundColor: '#000000',
                color: '#ffffff',
                borderRadius: '8px',
                border: '2px solid #000000',
                display: 'block',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
                e.currentTarget.style.color = '#000000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                e.currentTarget.style.color = '#ffffff'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Scrapers</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Start scraping leads
              </p>
            </Link>

            <Link 
              href="/leads"
              style={{
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: '8px',
                border: '2px solid #000000',
                display: 'block',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
                e.currentTarget.style.color = '#000000'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📋</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Leads</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                Manage and verify leads
              </p>
            </Link>

            <Link 
              href="/customers"
              style={{
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: '8px',
                border: '2px solid #000000',
                display: 'block',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
                e.currentTarget.style.color = '#000000'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Customers</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                View customers and orders
              </p>
            </Link>

            <Link 
              href="/routes"
              style={{
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: '8px',
                border: '2px solid #000000',
                display: 'block',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
                e.currentTarget.style.color = '#000000'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🗺️</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Routes</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                Plan delivery routes
              </p>
            </Link>

            <Link 
              href="/analytics"
              style={{
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: '8px',
                border: '2px solid #000000',
                display: 'block',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
                e.currentTarget.style.color = '#000000'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Analytics</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                View metrics and insights
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
