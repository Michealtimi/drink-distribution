import { describe, it, expect } from 'vitest'
import { normalizePhone, validatePhone, validatePhoneWithReason } from './phone-utils'

describe('normalizePhone', () => {
  it('normalizes +234 801 234 5678 to 2348012345678', () => {
    expect(normalizePhone('+234 801 234 5678')).toBe('2348012345678')
  })
  it('normalizes 08012345678 to 2348012345678', () => {
    expect(normalizePhone('08012345678')).toBe('2348012345678')
  })
  it('normalizes 2348012345678 to 2348012345678', () => {
    expect(normalizePhone('2348012345678')).toBe('2348012345678')
  })
  it('returns empty string for empty input', () => {
    expect(normalizePhone('')).toBe('')
  })
  it('strips non-digits and normalizes 10-digit', () => {
    expect(normalizePhone('8012345678')).toBe('2348012345678')
  })
})

describe('validatePhone', () => {
  it('accepts valid Nigerian number', () => {
    expect(validatePhone('2348012345678')).toBe(true)
    expect(validatePhone('08012345678')).toBe(true)
  })
  it('rejects too short', () => {
    expect(validatePhone('123')).toBe(false)
  })
  it('rejects all zeros', () => {
    expect(validatePhone('2340000000000')).toBe(false)
  })
  it('rejects all ones', () => {
    expect(validatePhone('2341111111111')).toBe(false)
  })
})

describe('validatePhoneWithReason', () => {
  it('returns valid: true for good number', () => {
    expect(validatePhoneWithReason('2348012345678')).toEqual({ valid: true })
  })
  it('returns reason for invalid length', () => {
    const r = validatePhoneWithReason('123')
    expect(r.valid).toBe(false)
    expect(r.reason).toContain('length')
  })
  it('returns reason for all zeros', () => {
    const r = validatePhoneWithReason('2340000000000')
    expect(r.valid).toBe(false)
    expect(r.reason).toContain('zeros')
  })
})
