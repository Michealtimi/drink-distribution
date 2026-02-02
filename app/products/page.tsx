'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ToastContainer, { useToast } from '../components/Toast'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

interface Product {
  id: string
  name: string
  category: string
  unitPrice: number
  unit: string
  supplier: { id: string; name: string } | null
  isActive: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterActive, setFilterActive] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [filterCategory, filterActive])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.supplier && product.supplier.name.toLowerCase().includes(query))
      )
    })
    setFilteredProducts(filtered)
  }, [searchQuery, products])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCategory) params.append('category', filterCategory)
      if (filterActive) params.append('isActive', filterActive)

      const response = await fetch(`/api/products?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      showToast('Product deleted successfully', 'success')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      showToast('Failed to delete product', 'error')
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Products</h1>
        <Link
          href="/products/new"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Add Product
        </Link>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <SearchBar
          placeholder="Search by name, category..."
          onSearch={setSearchQuery}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          <option value="">All Categories</option>
          <option value="ENERGY_DRINK">Energy Drink</option>
          <option value="COGNAC">Cognac</option>
          <option value="WATER">Water</option>
          <option value="SOFT_DRINK">Soft Drink</option>
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
          }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Unit Price</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Unit</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Supplier</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr 
                key={product.id} 
                style={{ 
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <td style={{ padding: '1rem' }}>{product.name}</td>
                <td style={{ padding: '1rem' }}>{product.category.replace('_', ' ')}</td>
                <td style={{ padding: '1rem' }}>₦{product.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>{product.unit}</td>
                <td style={{ padding: '1rem' }}>{product.supplier?.name || '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: product.isActive ? '#d1fae5' : '#fee2e2',
                    color: product.isActive ? '#065f46' : '#991b1b',
                  }}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/products/${product.id}`}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                      }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      style={{
                        color: '#ef4444',
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && products.length === 0 && (
          <EmptyState
            title="No products yet"
            description="Add products to your catalog to start creating orders."
            actionLabel="Add Product"
            actionHref="/products/new"
            icon="📦"
          />
        )}
        {filteredProducts.length === 0 && products.length > 0 && (
          <EmptyState
            title="No products match your search"
            description={`No products found matching "${searchQuery}". Try adjusting your search or filters.`}
            icon="🔍"
          />
        )}
      </div>
    </div>
  )
}
