import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/orders/route'

function nextRequestGet(url = 'http://localhost/api/orders?limit=10') {
  return new NextRequest(url)
}

function nextRequestPost(body: object) {
  return new NextRequest('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Orders API', () => {
  beforeEach(() => {
    vi.mocked(prisma.order.findMany).mockReset()
    vi.mocked(prisma.order.create).mockReset()
  })

  describe('GET /api/orders', () => {
    it('returns list of orders with customer', async () => {
      const mockOrders = [
        {
          id: 'ord-1',
          customerId: 'cust-1',
          orderNumber: 'ORD-1',
          status: 'PENDING',
          totalAmount: 100,
          paymentStatus: 'PENDING',
          deliveryDate: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: { name: 'Test Customer', phone: '08012345678' },
        },
      ]
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders)

      const req = nextRequestGet()
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(1)
      expect(data[0].orderNumber).toBe('ORD-1')
      expect(data[0].customer).toEqual({ name: 'Test Customer', phone: '08012345678' })
    })

    it('respects list limit', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([])

      const req = nextRequestGet('http://localhost/api/orders?limit=50')
      await GET(req)
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      )
    })
  })

  describe('POST /api/orders', () => {
    const validBody = {
      customerId: 'cust-1',
      items: [
        { productName: 'Red Bull', quantity: 24, unitPrice: 150 },
      ],
    }

    it('returns 400 when validation fails (missing items)', async () => {
      const req = nextRequestPost({ customerId: 'cust-1' })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBeDefined()
      expect(prisma.order.create).not.toHaveBeenCalled()
    })

    it('returns 201 and creates order with valid body', async () => {
      const created = {
        id: 'new-ord',
        customerId: validBody.customerId,
        orderNumber: 'ORD-123-abc',
        status: 'PENDING',
        totalAmount: 3600,
        paymentStatus: 'PENDING',
        deliveryDate: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        customer: { name: 'C', phone: '080' },
      }
      vi.mocked(prisma.order.create).mockResolvedValue(created)

      const req = nextRequestPost(validBody)
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.orderNumber).toMatch(/^ORD-\d+-[a-z0-9]+$/)
      expect(json.totalAmount).toBe(3600)
      expect(prisma.order.create).toHaveBeenCalledOnce()
    })
  })
})
