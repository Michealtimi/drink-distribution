'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ToastContainer, { useToast } from '../../components/Toast'
import LoadingSkeleton from '../../components/LoadingSkeleton'

interface ImportBatch {
  id: string
  fileName: string
  source: string
  totalRows: number
  imported: number
  duplicates: number
  errors: number
  errorDetails: string | null
  importedAt: string
}

export default function ImportDetailPage() {
  const params = useParams()
  const { toasts, showToast, removeToast } = useToast()
  const [importBatch, setImportBatch] = useState<ImportBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorDetails, setErrorDetails] = useState<string[]>([])

  useEffect(() => {
    fetchImport()
  }, [params.id])

  const fetchImport = async () => {
    try {
      const response = await fetch(`/api/imports/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch import details')
      }
      const data = await response.json()
      setImportBatch(data)
      
      if (data.errorDetails) {
        try {
          const parsed = JSON.parse(data.errorDetails)
          setErrorDetails(Array.isArray(parsed) ? parsed : [])
        } catch {
          setErrorDetails([data.errorDetails])
        }
      }
    } catch (error) {
      console.error('Error fetching import:', error)
      showToast('Failed to load import details', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <LoadingSkeleton rows={8} columns={2} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  if (!importBatch) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <p>Import not found</p>
        <Link href="/imports">Back to Imports</Link>
      </div>
    )
  }

  const successRate = ((importBatch.imported / importBatch.totalRows) * 100).toFixed(1)

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/imports"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'inline-block',
          }}
        >
          ← Back to Imports
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          Import Details: {importBatch.fileName}
        </h1>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>File Name</div>
            <div style={{ fontWeight: '500' }}>{importBatch.fileName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Source</div>
            <div style={{ fontWeight: '500' }}>{importBatch.source}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Rows</div>
            <div style={{ fontWeight: '500' }}>{importBatch.totalRows}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Success Rate</div>
            <div style={{ fontWeight: '500', color: '#059669' }}>{successRate}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Imported</div>
            <div style={{ fontWeight: '500', color: '#059669' }}>{importBatch.imported}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Duplicates</div>
            <div style={{ fontWeight: '500', color: '#d97706' }}>{importBatch.duplicates}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Errors</div>
            <div style={{ fontWeight: '500', color: importBatch.errors > 0 ? '#dc2626' : '#059669' }}>
              {importBatch.errors}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Imported At</div>
            <div style={{ fontWeight: '500' }}>
              {new Date(importBatch.importedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {errorDetails.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Error Details ({errorDetails.length})
            </h3>
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              borderRadius: '6px',
              border: '1px solid #fecaca',
            }}>
              {errorDetails.map((error, idx) => (
                <div key={idx} style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#991b1b',
                }}>
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
