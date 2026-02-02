import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { City, CustomerType, LeadStatus } from '@prisma/client'
import { batchImportLeadRecords } from '@/lib/lead-import-pipeline'
import { badRequest, internalError } from '@/lib/api-errors'

/**
 * Create leads from extracted contacts (email/phone).
 * Batched: one lookup for existing phones/emails, then createMany in chunks.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contacts, city, category } = body as {
      contacts: Array<{ phone?: string; email?: string; name?: string }>
      city: City
      category: CustomerType
    }

    if (!Array.isArray(contacts) || contacts.length === 0 || !city || !category) {
      return badRequest('contacts (array), city, and category are required')
    }

    if (!Object.values(City).includes(city) || !Object.values(CustomerType).includes(category)) {
      return badRequest('Invalid city or category')
    }

    const normalized: Array<{ name: string; phone: string; email: string | null }> = []
    const phonesToLookup: string[] = []
    const emailsToLookup: string[] = []

    for (const c of contacts) {
      const phone = (c.phone || '').replace(/\D/g, '')
      const email = (c.email || '').trim().toLowerCase()
      const name = (c.name || c.phone || c.email || 'Contact').trim().slice(0, 200)
      if (!phone && !email) continue

      const phoneForDb = phone
        ? (phone.startsWith('234') ? phone.slice(0, 13) : '234' + phone.replace(/^0/, '').slice(0, 10))
        : 'NO_PHONE'
      normalized.push({ name, phone: phoneForDb, email: email || null })
      if (phoneForDb !== 'NO_PHONE') phonesToLookup.push(phoneForDb)
      if (email) emailsToLookup.push(email)
    }

    const [byPhone, byEmail] = await Promise.all([
      phonesToLookup.length > 0
        ? prisma.lead.findMany({
            where: { phone: { in: [...new Set(phonesToLookup)] } },
            select: { phone: true, email: true },
          })
        : [],
      emailsToLookup.length > 0
        ? prisma.lead.findMany({
            where: { email: { in: [...new Set(emailsToLookup)] } },
            select: { email: true },
          })
        : [],
    ])
    const existingPhones = new Set(byPhone.map((l) => l.phone).filter(Boolean))
    const existingEmails = new Set((byEmail.map((l) => l.email).filter(Boolean) as string[]).concat(byPhone.map((l) => l.email).filter(Boolean) as string[]))

    const records = normalized.map(({ name, phone, email }) => ({
      name,
      phone,
      email,
      city,
      category,
      source: 'Email/Phone extractor',
      status: LeadStatus.SCRAPED as LeadStatus,
    }))

    const { imported, skipped, errors } = await batchImportLeadRecords(
      records,
      existingPhones,
      existingEmails
    )

    return NextResponse.json({
      success: true,
      created: imported,
      skipped,
      createdNames: [], // Omit per-name to keep payload small; client can use created count
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    })
  } catch (error) {
    console.error('From-contacts error:', error)
    return internalError('Failed to create leads')
  }
}
