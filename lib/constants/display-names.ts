import type { CustomerType, City } from '@prisma/client'

/**
 * Single source of display names for category and city.
 * Used by message-generator (templates, first/follow-up messages) and any UI that shows human-readable labels.
 */
export const CATEGORY_DISPLAY_NAMES: Record<CustomerType, string> = {
  DISTRIBUTOR: 'distributor',
  SUPPLIER: 'supplier',
  CONSUMER: 'consumer',
  GYM: 'gym',
  EVENT_CENTER: 'event center',
  CLUB: 'club',
  LOUNGE: 'lounge',
  OFFICE: 'office',
  SMALL_RETAILER: 'retailer',
  OTHER: 'business',
}

export const CITY_DISPLAY_NAMES: Record<City, string> = {
  LAGOS: 'Lagos',
  ABUJA: 'Abuja',
}
