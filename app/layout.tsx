import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'Beverage Distribution CRM',
  description: 'FMCG beverage distribution automation system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
