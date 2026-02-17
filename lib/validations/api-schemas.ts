/**
 * Shared Zod schemas for API request validation.
 * Used by businesses, customers, orders, templates, suppliers routes.
 */
import { z } from 'zod'
import { City, CustomerType, OrderStatus, PaymentStatus, ScraperType } from '@prisma/client'

const cityEnum = z.nativeEnum(City)
const customerTypeEnum = z.nativeEnum(CustomerType)
const scraperTypeEnum = z.nativeEnum(ScraperType)
const orderStatusEnum = z.nativeEnum(OrderStatus)
const paymentStatusEnum = z.nativeEnum(PaymentStatus)

/** Default and max list limit for GET list endpoints */
export const DEFAULT_LIST_LIMIT = 100
export const MAX_LIST_LIMIT = 500

/**
 * Parse limit from searchParams (e.g. ?limit=50). Clamps to [1, MAX_LIST_LIMIT].
 */
export function parseListLimit(searchParams: URLSearchParams): number {
  const raw = searchParams.get('limit')
  if (raw == null) return DEFAULT_LIST_LIMIT
  const n = parseInt(raw, 10)
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIST_LIMIT
  return Math.min(n, MAX_LIST_LIMIT)
}

// ----- Business -----
export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  city: cityEnum,
  category: customerTypeEnum,
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  name: z.string().min(1).optional(),
  city: cityEnum.optional(),
  category: customerTypeEnum.optional(),
})

// ----- Customer (filter only; customers are created via lead conversion) -----
// No createCustomerSchema for list route; GET uses filters + limit.

// ----- Order -----
export const orderItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
})

export const createOrderSchema = z.object({
  customerId: z.string().min(1, 'customerId is required'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional().nullable(),
})

export const updateOrderSchema = z.object({
  status: orderStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  deliveryDate: z.union([z.string(), z.null()]).optional(),
  notes: z.string().optional().nullable(),
})

// ----- MessageTemplate -----
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  category: customerTypeEnum.optional().nullable(),
  city: cityEnum.optional().nullable(),
  stage: z.string().min(1, 'Stage is required'),
  content: z.string().min(1, 'Content is required'),
  variables: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
})

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  category: customerTypeEnum.optional().nullable(),
  city: cityEnum.optional().nullable(),
  stage: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// ----- Supplier -----
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().optional().nullable(),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: cityEnum.optional().nullable(),
  products: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

export const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().optional().nullable(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: cityEnum.optional().nullable(),
  products: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>

// ----- Scrapers run -----
export const scraperRunSchema = z.object({
  type: scraperTypeEnum.optional(),
  types: z.array(scraperTypeEnum).optional(),
  query: z.string().optional(),
  queries: z.union([z.string(), z.array(z.string())]).optional(),
  city: cityEnum.optional().nullable(),
  category: customerTypeEnum.optional().nullable(),
  area: z.string().optional().nullable(),
  runAllAreas: z.boolean().optional(),
  maxResults: z.number().int().min(1).max(200).optional(),
  checkWhatsAppBeforeImport: z.boolean().optional(),
}).refine((data) => (data.types?.length ?? 0) > 0 || data.type != null, {
  message: 'Missing required field: type or types array',
}).refine((data) => {
  const q = data.queries ?? data.query
  if (q == null) return false
  if (typeof q === 'string') return q.trim().length > 0
  return Array.isArray(q) && q.some((s) => String(s).trim().length > 0)
}, { message: 'Missing required field: query (or queries array)' })

export type ScraperRunInput = z.infer<typeof scraperRunSchema>
