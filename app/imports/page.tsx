'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ToastContainer, { useToast } from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'

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

export default function ImportsPage() {
  const [imports, setImports] = useState<ImportBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchImports()
  }, [])

  const fetchImports = async () => {
    try {
      const response = await fetch('/api/imports')
      if (!response.ok) {
        throw new Error('Failed to fetch imports')
      }
      const data = await response.json()
      setImports(data)
    } catch (error) {
      console.error('Error fetching imports:', error)
      showToast('Failed to load import history', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      showToast('Please upload a CSV file', 'error')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/imports/csv', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import CSV')
      }

      const result = await response.json()
      showToast(
        `Import completed: ${result.imported} imported, ${result.duplicates} duplicates, ${result.errors} errors`,
        'success'
      )
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      fetchImports()
    } catch (error: any) {
      console.error('Error uploading file:', error)
      showToast(error.message || 'Failed to import CSV', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <>
        <LoadingSkeleton rows={8} columns={7} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        CSV Imports
      </h1>

      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Upload CSV File
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
          CSV should have columns: name, phone, email (optional), address (optional), area (optional), city (LAGOS/ABUJA), category (DISTRIBUTOR/SUPPLIER/CONSUMER/GYM/EVENT_CENTER/CLUB/LOUNGE/OFFICE/SMALL_RETAILER/OTHER)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            width: '100%',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        />
        {uploading && (
          <div style={{ marginTop: '1rem', color: '#3b82f6' }}>
            Uploading and processing...
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', padding: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
          Import History
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>File Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Source</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Total Rows</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Imported</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Duplicates</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Errors</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((importBatch) => (
              <tr 
                key={importBatch.id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <td style={{ padding: '1rem' }}>{importBatch.fileName}</td>
                <td style={{ padding: '1rem' }}>{importBatch.source}</td>
                <td style={{ padding: '1rem' }}>{importBatch.totalRows}</td>
                <td style={{ padding: '1rem', color: '#059669', fontWeight: '500' }}>
                  {importBatch.imported}
                </td>
                <td style={{ padding: '1rem', color: '#d97706', fontWeight: '500' }}>
                  {importBatch.duplicates}
                </td>
                <td style={{ padding: '1rem', color: importBatch.errors > 0 ? '#dc2626' : '#059669', fontWeight: '500' }}>
                  {importBatch.errors}
                </td>
                <td style={{ padding: '1rem' }}>
                  {new Date(importBatch.importedAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  <Link
                    href={`/imports/${importBatch.id}`}
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'underline',
                      fontSize: '0.875rem',
                    }}
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {imports.length === 0 && (
          <EmptyState
            title="No imports yet"
            description="Upload a CSV file to import leads."
            icon="📥"
          />
        )}
      </div>
    </div>
  )
}
