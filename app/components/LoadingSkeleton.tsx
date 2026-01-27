'use client'

interface LoadingSkeletonProps {
  rows?: number
  columns?: number
}

export default function LoadingSkeleton({ rows = 5, columns = 8 }: LoadingSkeletonProps) {
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            height: '2rem',
            width: '200px',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            marginBottom: '1rem',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
        <div
          style={{
            height: '1rem',
            width: '400px',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        {/* Table header skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '1rem',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ))}
        </div>

        {/* Table rows skeleton */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: '1rem',
              padding: '1rem',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                style={{
                  height: '1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  animationDelay: `${rowIndex * 0.1}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
