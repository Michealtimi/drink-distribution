import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { LeadStatus, City, CustomerType } from '@prisma/client'
import { sortLeadsByPriority } from '@/lib/lead-priority'
import { badRequest, conflict, internalError } from '@/lib/api-errors'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.enum([City.LAGOS, City.ABUJA]),
  category: z.nativeEnum(CustomerType),
  source: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.phone || (data.email && data.email !== ''), {
  message: 'At least one of phone or email is required',
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as LeadStatus | null
    const city = searchParams.get('city') as City | null
    const category = searchParams.get('category') as CustomerType | null
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    )
    const cursor = searchParams.get('cursor') ?? undefined

    const where = {
      ...(status && Object.values(LeadStatus).includes(status) && { status }),
      ...(city && Object.values(City).includes(city) && { city }),
      ...(category && Object.values(CustomerType).includes(category) && { category }),
    }

    if (sortBy === 'priority') {
      const leads = await prisma.lead.findMany({
        where,
        take: limit,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      })
      const sortedLeads = sortLeadsByPriority(leads)
      const nextCursor = sortedLeads.length === limit ? sortedLeads[sortedLeads.length - 1]?.id : null
      return NextResponse.json({
        data: sortedLeads,
        nextCursor,
        limit,
      })
    }

    const orderBy: Record<string, 'asc' | 'desc'> =
      sortBy === 'name' ? { name: sortOrder as 'asc' | 'desc' }
      : sortBy === 'status' ? { status: sortOrder as 'asc' | 'desc' }
      : sortBy === 'city' ? { city: sortOrder as 'asc' | 'desc' }
      : sortBy === 'category' ? { category: sortOrder as 'asc' | 'desc' }
      : { createdAt: sortOrder as 'asc' | 'desc' }

    const leads = await prisma.lead.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })
    const hasMore = leads.length > limit
    const data = hasMore ? leads.slice(0, limit) : leads
    const nextCursor = hasMore ? data[data.length - 1]?.id : null

    return NextResponse.json({ data, nextCursor, limit })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return internalError('Failed to fetch leads')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createLeadSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
        ? Object.entries(parsed.error.flatten().fieldErrors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join('; ')
        : parsed.error.message
      return badRequest(msg || 'Validation failed', parsed.error.flatten())
    }
    const { name, phone, email, address, area, city, category, source, notes } = parsed.data
    const emailNorm = email && email !== '' ? email.trim().toLowerCase() : null

    if (phone) {
      const existingByPhone = await prisma.lead.findFirst({ where: { phone } })
      if (existingByPhone) {
        return conflict('Lead with this phone number already exists', existingByPhone)
      }
    }
    if (emailNorm) {
      const existingByEmail = await prisma.lead.findFirst({
        where: { email: emailNorm },
      })
      if (existingByEmail) {
        return conflict('Lead with this email already exists', existingByEmail)
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        phone: phone || 'NO_PHONE',
        email: emailNorm,
        address: address ?? null,
        area: area ?? null,
        city,
        category,
        source: source ?? null,
        notes: notes ?? null,
        status: LeadStatus.UNVERIFIED,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return internalError('Failed to create lead')
  }
}
