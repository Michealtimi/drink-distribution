'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// No login required – redirect to home
export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
    }}>
      <p style={{ color: '#6b7280' }}>Redirecting...</p>
    </div>
  )
}
