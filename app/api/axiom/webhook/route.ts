import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus, City, CustomerType, PaymentStatus, OrderStatus } from '@prisma/client'
import { deduplicateLeads } from '@/lib/lead-deduplicator'
import { ScrapedLead } from '@/lib/scrapers/base-scraper'

/**
 * Webhook payload structure from Axiom bots
 */
interface AxiomWebhookPayload {
  botId?: string
  status: 'progress' | 'completed' | 'error'
  type?: 'lead-import' | 'inventory-sync' | 'payment-verification' | 'order-sync' | 'ui-test'
  data?: any
  timestamp?: string
}

/**
 * Axiom lead structure (from webhook)
 */
interface AxiomLead {
  name: string
  phone?: string
  email?: string
  address?: string
  city: City
  category: CustomerType
  source?: string
}

/**
 * Normalize phone number to Nigerian format
 * Reuses pattern from app/api/leads/axiom/route.ts
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle Nigerian formats
  if (cleaned.startsWith('234')) {
    return cleaned.substring(0, 13) // Ensure max 13 digits
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  
  // Return with country code
  return `234${cleaned.substring(0, 10)}`
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (Nigerian format)
 */
function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // Nigerian phone: 234 + 10 digits = 13 digits total
  return cleaned.length >= 10 && cleaned.length <= 13
}

/**
 * Validate a single lead
 */
function validateLead(lead: AxiomLead, index: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name is required
  if (!lead.name || lead.name.trim().length === 0) {
    errors.push(`Lead ${index}: Missing required field 'name'`)
  }

  // City is required and must be valid
  if (!lead.city || (lead.city !== City.LAGOS && lead.city !== City.ABUJA)) {
    errors.push(`Lead ${index}: Invalid or missing 'city' (must be LAGOS or ABUJA)`)
  }

  // Category is required and must be valid
  const validCategories = Object.values(CustomerType)
  if (!lead.category || !validCategories.includes(lead.category)) {
    errors.push(`Lead ${index}: Invalid or missing 'category'`)
  }

  // At least one contact method required (phone OR email)
  if (!lead.phone && !lead.email) {
    errors.push(`Lead ${index}: At least one of 'phone' or 'email' is required`)
  }

  // Validate phone if provided
  if (lead.phone && lead.phone.trim().length > 0) {
    if (!validatePhone(lead.phone)) {
      errors.push(`Lead ${index}: Invalid phone format`)
    }
  }

  // Validate email if provided
  if (lead.email && lead.email.trim().length > 0) {
    if (!validateEmail(lead.email)) {
      errors.push(`Lead ${index}: Invalid email format`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Handle lead import webhook
 * Processes lead arrays, normalizes phones, deduplicates, imports to database
 */
async function handleLeadImport(data: any, source?: string) {
  if (!data.leads || !Array.isArray(data.leads)) {
    throw new Error('Invalid lead data: leads must be an array')
  }

  const leads: AxiomLead[] = data.leads
  const leadSource = source || data.source || 'Axiom.ai Webhook'

  if (leads.length === 0) {
    return {
      imported: 0,
      duplicates: 0,
      errors: 0,
    }
  }

  // Validate all leads first
  const validationResults = leads.map((lead, index) => validateLead(lead, index))
  const allErrors = validationResults.flatMap((result) => result.errors)

  if (allErrors.length > 0) {
    throw new Error(`Validation failed: ${allErrors.join('; ')}`)
  }

  // Normalize and prepare leads for deduplication
  const normalizedLeads = leads.map((lead) => ({
    name: lead.name.trim(),
    phone: lead.phone ? normalizePhone(lead.phone) : '',
    email: lead.email ? lead.email.trim().toLowerCase() : undefined,
    address: lead.address ? lead.address.trim() : undefined,
    area: undefined, // Can be extracted from address later
    city: lead.city,
    category: lead.category,
  }))

  // Convert to ScrapedLead format for deduplication
  const scrapedLeads: ScrapedLead[] = normalizedLeads.map((lead) => ({
    name: lead.name,
    phone: lead.phone || 'NO_PHONE', // Use placeholder for deduplication
    address: lead.address,
    area: lead.area,
    city: lead.city,
    category: lead.category,
  }))

  // Deduplicate using existing utility
  const { unique, duplicates } = await deduplicateLeads(scrapedLeads)

  // Import unique leads in transaction
  const results = await prisma.$transaction(async (tx) => {
    const created = []
    const errors = []

    for (let i = 0; i < unique.length; i++) {
      const scrapedLead = unique[i]
      const normalizedLead = normalizedLeads.find(
        (nl) => nl.name === scrapedLead.name && nl.city === scrapedLead.city
      )
      // Safety check: ensure we found a matching normalized lead
      if (!normalizedLead) {
        errors.push({
          lead: scrapedLead,
          error: 'Normalized lead not found for scraped lead after deduplication',
        })
        continue
      }

      try {
        // Check for duplicate by email if phone is not available
        if (!normalizedLead.phone || normalizedLead.phone === 'NO_PHONE') {
          if (normalizedLead.email) {
            const existingByEmail = await tx.lead.findFirst({
              where: {
                email: normalizedLead.email,
              },
            })

            if (existingByEmail) {
              duplicates.push({
                lead: scrapedLead,
                existing: existingByEmail,
                reason: 'email',
              })
              continue
            }
          }
        }

        const leadData: any = {
          name: normalizedLead.name,
          phone: normalizedLead.phone && normalizedLead.phone !== 'NO_PHONE'
            ? normalizedLead.phone
            : 'NO_PHONE',
          address: normalizedLead.address || null,
          area: normalizedLead.area || null,
          city: normalizedLead.city,
          category: normalizedLead.category,
          status: LeadStatus.SCRAPED,
          source: leadSource,
        }

        // Add email if provided
        if (normalizedLead.email) {
          leadData.email = normalizedLead.email
        }

        const createdLead = await tx.lead.create({
          data: leadData,
        })
        created.push(createdLead)
      } catch (error) {
        errors.push({
          lead: scrapedLead,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return { created, errors }
  })

  return {
    imported: results.created.length,
    duplicates: duplicates.length,
    errors: results.errors.length,
  }
}

/**
 * Handle payment verification webhook
 * Updates payment status when bank transfers are verified
 */
async function handlePaymentVerification(data: any) {
  if (!data.orderId && !data.orderNumber) {
    throw new Error('Invalid payment data: orderId or orderNumber is required')
  }

  const order = await prisma.order.findFirst({
    where: data.orderId
      ? { id: data.orderId }
      : { orderNumber: data.orderNumber },
    include: { customer: true },
  })

  if (!order) {
    throw new Error(`Order not found: ${data.orderId || data.orderNumber}`)
  }

  // Create payment record if amount is provided
  if (data.amount) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod || 'Transfer',
        reference: data.reference || null,
        notes: data.notes || null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      },
    })
  }

  // Update order payment status
  const paymentStatus = data.paymentStatus || PaymentStatus.PAID
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus,
      updatedAt: new Date(),
    },
  })

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentStatus,
  }
}

/**
 * Handle order sync webhook
 * Syncs order status from supplier portals
 */
async function handleOrderSync(data: any) {
  if (!data.orderId && !data.orderNumber) {
    throw new Error('Invalid order data: orderId or orderNumber is required')
  }

  const order = await prisma.order.findFirst({
    where: data.orderId
      ? { id: data.orderId }
      : { orderNumber: data.orderNumber },
  })

  if (!order) {
    throw new Error(`Order not found: ${data.orderId || data.orderNumber}`)
  }

  const updateData: any = {
    updatedAt: new Date(),
  }

  // Update order status if provided
  if (data.status) {
    const validStatuses = Object.values(OrderStatus)
    if (validStatuses.includes(data.status)) {
      updateData.status = data.status
    }
  }

  // Update delivery date if provided
  if (data.deliveryDate) {
    updateData.deliveryDate = new Date(data.deliveryDate)
  }

  // Update notes if provided
  if (data.notes) {
    updateData.notes = data.notes
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: updateData,
  })

  return {
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    status: updatedOrder.status,
  }
}

/**
 * Handle inventory sync webhook
 * Receives inventory/pricing data (placeholder for future use)
 */
async function handleInventorySync(data: any) {
  // Placeholder for future inventory management
  // For now, just acknowledge receipt
  return {
    received: true,
    message: 'Inventory sync received (not yet implemented)',
    data: data,
  }
}

/**
 * Handle UI test webhook
 * Processes UI test results
 */
async function handleUITest(data: any) {
  // Process UI test results
  // This can be used to verify that Axiom bots can interact with the system
  return {
    success: true,
    message: 'UI test completed',
    testResults: data.testResults || data,
    timestamp: new Date().toISOString(),
  }
}

/**
 * POST handler for Axiom webhook endpoint
 * Handles webhooks from browser extension bots (no API key needed)
 */
export async function POST(request: NextRequest) {
  try {
    const payload: AxiomWebhookPayload = await request.json()
    const { botId, status, type, data, timestamp } = payload

    // Log webhook receipt
    console.log(`[Axiom Webhook] Received ${type || 'unknown'} webhook from bot ${botId || 'unknown'}, status: ${status}`)

    // Handle error status
    if (status === 'error') {
      console.error(`[Axiom Webhook] Error from bot ${botId}:`, data)
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook reported error',
          details: data,
        },
        { status: 400 }
      )
    }

    // Determine webhook type
    // Backward compatibility: if no type specified but data.leads exists, treat as lead import
    let webhookType = type
    if (!webhookType && data?.leads && Array.isArray(data.leads)) {
      webhookType = 'lead-import'
    }

    if (!webhookType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook type is required or data.leads must be provided',
        },
        { status: 400 }
      )
    }

    // Route to appropriate handler
    let result: any

    switch (webhookType) {
      case 'lead-import':
        result = await handleLeadImport(data, data?.source)
        break

      case 'payment-verification':
        result = await handlePaymentVerification(data)
        break

      case 'order-sync':
        result = await handleOrderSync(data)
        break

      case 'inventory-sync':
        result = await handleInventorySync(data)
        break

      case 'ui-test':
        result = await handleUITest(data)
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown webhook type: ${webhookType}`,
            supportedTypes: [
              'lead-import',
              'payment-verification',
              'order-sync',
              'inventory-sync',
              'ui-test',
            ],
          },
          { status: 400 }
        )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      type: webhookType,
      status,
      botId,
      timestamp: timestamp || new Date().toISOString(),
      ...result,
    })
  } catch (error) {
    console.error('[Axiom Webhook] Error processing webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
