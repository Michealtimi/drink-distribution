import { describe, it, expect, vi } from 'vitest'
import { City, CustomerType } from '@prisma/client'

// Mock prisma so message-generator can load (it imports prisma for getTemplate)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    messageTemplate: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}))

import { generateFirstMessage, generateFollowUpMessage, getWhatsAppLink } from './message-generator'

describe('generateFirstMessage', () => {
  it('includes name, category, and city', () => {
    const msg = generateFirstMessage({
      name: 'Test Gym',
      category: CustomerType.GYM,
      city: City.LAGOS,
    })
    expect(msg).toContain('Test Gym')
    expect(msg).toContain('Lagos')
    expect(msg).toContain('energy drink')
  })
  it('includes area when provided (segment that uses area, e.g. NIGHTCLUB)', () => {
    const msg = generateFirstMessage({
      name: 'Joe',
      category: CustomerType.LOUNGE,
      city: City.LAGOS,
      area: 'Victoria Island',
    })
    expect(msg).toContain('Victoria Island')
  })
})

describe('generateFollowUpMessage', () => {
  it('returns month-end message when isMonthEnd true', () => {
    const msg = generateFollowUpMessage({
      name: 'Jane',
      category: CustomerType.LOUNGE,
      city: City.LAGOS,
      isMonthEnd: true,
    })
    expect(msg).toContain('month-end')
    expect(msg).toContain('Jane')
  })
  it('returns day-2 follow-up when followUpDay is 2', () => {
    const msg = generateFollowUpMessage({
      name: 'Bob',
      category: CustomerType.GYM,
      city: City.ABUJA,
      followUpDay: 2,
    })
    expect(msg).toContain('following up')
    expect(msg).toContain('Bob')
  })
})

describe('getWhatsAppLink', () => {
  it('produces wa.me link with Nigerian number and encoded message', () => {
    const link = getWhatsAppLink('2348012345678', 'Hi there')
    expect(link).toContain('wa.me/2348012345678')
    expect(link).toContain('text=')
  })
  it('strips non-digits and adds 234 prefix for local number', () => {
    const link = getWhatsAppLink('08012345678', 'Hello')
    expect(link).toContain('wa.me/2348012345678')
  })
})
