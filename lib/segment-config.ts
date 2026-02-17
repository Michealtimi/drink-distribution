import type { CustomerType } from '@prisma/client'

/**
 * Segment groups from TARGET_SEGMENTS_AND_GO_TO_MARKET.md
 * Used by: scraper presets, message generator (which copy to use), analytics
 */
export type SegmentGroup = 'A_PRIMARY' | 'B_VOLUME' | 'C_INSTITUTIONAL'

export type MessageVariant = 'UNIVERSAL' | 'NIGHTCLUB' | 'EVENT_PLANNER'

/** Map app category → segment group */
export const CATEGORY_TO_GROUP: Record<CustomerType, SegmentGroup> = {
  CLUB: 'A_PRIMARY',
  LOUNGE: 'A_PRIMARY',
  EVENT_CENTER: 'A_PRIMARY',
  GYM: 'A_PRIMARY',
  SMALL_RETAILER: 'B_VOLUME',
  DISTRIBUTOR: 'B_VOLUME',
  SUPPLIER: 'B_VOLUME',
  OFFICE: 'C_INSTITUTIONAL',
  CONSUMER: 'B_VOLUME',
  OTHER: 'B_VOLUME',
}

/** Which message variant to use per category (cold WhatsApp best conversion) */
export const CATEGORY_MESSAGE_VARIANT: Record<CustomerType, MessageVariant> = {
  CLUB: 'NIGHTCLUB',
  LOUNGE: 'NIGHTCLUB',
  EVENT_CENTER: 'EVENT_PLANNER',
  GYM: 'UNIVERSAL',
  SMALL_RETAILER: 'UNIVERSAL',
  OFFICE: 'UNIVERSAL',
  DISTRIBUTOR: 'UNIVERSAL',
  SUPPLIER: 'UNIVERSAL',
  CONSUMER: 'UNIVERSAL',
  OTHER: 'UNIVERSAL',
}

/** Suggested scraper search queries per segment (use in Scrapers UI / presets) */
export const SCRAPER_QUERIES_BY_SEGMENT: Record<SegmentGroup, string[]> = {
  A_PRIMARY: [
    'nightclub',
    'lounge',
    'bar',
    'event center',
    'event venue',
    'gym',
    'fitness studio',
    'energy drink supplier',
    'Red Bull distributor',
  ],
  B_VOLUME: [
    'supermarket',
    'mini market',
    'liquor store',
    'drink depot',
    'hotel',
    'resort',
    'retail',
  ],
  C_INSTITUTIONAL: [
    'corporate office',
    'co-working',
    'office',
    'government event',
  ],
}

/** All suggested queries for Lagos/Abuja (flat list for scraper) */
export const SCRAPER_QUERIES_ALL: string[] = [
  ...SCRAPER_QUERIES_BY_SEGMENT.A_PRIMARY,
  ...SCRAPER_QUERIES_BY_SEGMENT.B_VOLUME,
  ...SCRAPER_QUERIES_BY_SEGMENT.C_INSTITUTIONAL,
]

/** Human-readable segment group labels */
export const SEGMENT_GROUP_LABELS: Record<SegmentGroup, string> = {
  A_PRIMARY: 'Primary (Nightlife, Event, Gym)',
  B_VOLUME: 'Volume (Retail, Liquor, Hotel)',
  C_INSTITUTIONAL: 'Institutional (Office, Corporate)',
}
