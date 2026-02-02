'use client'

import { useCallback, useEffect, useState } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export default function ToastContainer({ toasts, onRemove }: ToastProps) {
  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, 5000)
      return () => clearTimeout(timer)
    })
  }, [toasts, onRemove])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
        width: '100%',
        padding: '0 1rem',
      }}
    >
      {toasts.map((toast) => {
        const colors = {
          success: { bg: '#10b981', text: 'white' },
          error: { bg: '#ef4444', text: 'white' },
          info: { bg: '#3b82f6', text: 'white' },
          warning: { bg: '#f59e0b', text: 'white' },
        }
        const color = colors[toast.type]

        return (
          <div
            key={toast.id}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: color.bg,
              color: color.text,
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
              animation: 'slideIn 0.3s ease-out',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: color.text,
                cursor: 'pointer',
                fontSize: '1.25rem',
                lineHeight: 1,
                opacity: 0.8,
                padding: 0,
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        )
      })}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Hook for managing toasts (stable callbacks so consumers can use them in useEffect deps)
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showToast, removeToast }
}
