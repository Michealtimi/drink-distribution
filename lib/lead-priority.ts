import { CustomerType } from '@prisma/client'

export const CATEGORY_PRIORITY: Record<CustomerType, number> = {
  DISTRIBUTOR: 1,
  SUPPLIER: 2,
  CONSUMER: 3,
  GYM: 4,
  EVENT_CENTER: 5,
  CLUB: 6,
  LOUNGE: 7,
  OFFICE: 8,
  SMALL_RETAILER: 9,
  OTHER: 10,
} as const

export interface Lead {
  id: string
  category: CustomerType
  createdAt: Date | string
  [key: string]: any
}

export function sortLeadsByPriority(leads: Lead[]): Lead[] {
  return leads.sort((a, b) => {
    const priorityA = CATEGORY_PRIORITY[a.category] || 99
    const priorityB = CATEGORY_PRIORITY[b.category] || 99
    
    // First sort by priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // Then sort by date (newest first)
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })
}

export function getCategoryPriority(category: CustomerType): number {
  return CATEGORY_PRIORITY[category] || 99
}
