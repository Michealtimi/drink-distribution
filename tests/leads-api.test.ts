import { describe, it, expect, vi, beforeEach } from 'vitest'
import { City, CustomerType, LeadStatus } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}))

vi.mock('@/lib/lead-priority', () => ({
  sortLeadsByPriority: (leads: unknown[]) => leads,
}))

vi.mock('@/lib/message-generator', () => ({
  generateFirstMessage: vi.fn().mockReturnValue('Test message'),
}))

vi.mock('@/lib/whatsapp-send', () => ({
  sendWhatsApp: vi.fn().mockResolvedValue(undefined),
  checkNumberRegistered: vi.fn().mockResolvedValue(true),
}))

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/leads/route'

function nextRequestGet(url = 'http://localhost/api/leads?limit=2') {
  return new NextRequest(url)
}

function nextRequestPost(body: object) {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Leads API', () => {
  beforeEach(() => {
    vi.mocked(prisma.lead.findMany).mockReset()
    vi.mocked(prisma.lead.findFirst).mockReset()
    vi.mocked(prisma.lead.create).mockReset()
    vi.mocked(prisma.lead.groupBy).mockReset()
    process.env.WHATSAPP_WELCOME_ENABLED = 'false'
  })

  describe('GET /api/leads', () => {
    it('returns list with data, nextCursor, limit', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          name: 'Test Gym',
          status: LeadStatus.UNVERIFIED,
          city: City.LAGOS,
          category: CustomerType.GYM,
          phone: '08012345678',
          email: null,
          address: null,
          area: null,
          source: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      vi.mocked(prisma.lead.findMany).mockResolvedValue(mockLeads)

      const req = nextRequestGet('http://localhost/api/leads?limit=10')
      const res = await GET(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toHaveProperty('data')
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data).toHaveLength(1)
      expect(json.data[0].name).toBe('Test Gym')
      expect(json).toHaveProperty('limit', 10)
      expect(json).toHaveProperty('nextCursor')
    })

    it('respects limit and caps at max', async () => {
      vi.mocked(prisma.lead.findMany).mockResolvedValue([])

      const req = nextRequestGet('http://localhost/api/leads?limit=9999')
      const res = await GET(req)
      const json = await res.json()
      expect(json.limit).toBe(500)
    })
  })

  describe('POST /api/leads', () => {
    const validBody = {
      name: 'New Lead',
      phone: '08011112222',
      city: City.LAGOS,
      category: CustomerType.GYM,
    }

    it('returns 400 when validation fails (missing required)', async () => {
      const req = nextRequestPost({ name: 'Only Name' }) // missing phone/email, city, category
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBeDefined()
      expect(prisma.lead.create).not.toHaveBeenCalled()
    })

    it('returns 201 and creates lead with valid body', async () => {
      vi.mocked(prisma.lead.findFirst).mockResolvedValue(null)
      const created = {
        id: 'new-id',
        name: validBody.name,
        phone: validBody.phone,
        email: null,
        address: null,
        area: null,
        city: validBody.city,
        category: validBody.category,
        source: null,
        notes: null,
        status: LeadStatus.UNVERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      vi.mocked(prisma.lead.create).mockResolvedValue(created)

      const req = nextRequestPost(validBody)
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.name).toBe(validBody.name)
      expect(json.phone).toBe(validBody.phone)
      expect(json.status).toBe(LeadStatus.UNVERIFIED)
      expect(prisma.lead.create).toHaveBeenCalledOnce()
    })

    it('returns 409 when phone already exists', async () => {
      vi.mocked(prisma.lead.findFirst).mockResolvedValueOnce({ id: 'existing' } as never)

      const req = nextRequestPost(validBody)
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(409)
      expect(json.error).toBeDefined()
      expect(prisma.lead.create).not.toHaveBeenCalled()
    })
  })
})
