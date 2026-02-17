/**
 * Centralized Nigerian phone number normalization and validation.
 * Used by scrapers, lead import, extract-contacts, and lead-validator.
 */

/** Nigerian format: 234 + 10 digits = 13 digits total */
const NIGERIAN_PHONE_LENGTH = 13
const NIGERIAN_PREFIX = '234'

/**
 * Normalize phone number to Nigerian format (234 + 10 digits).
 * Handles +234, 234, 0xx, and raw 10-digit inputs.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 0) return ''

  if (digits.startsWith('234')) {
    return (NIGERIAN_PREFIX + digits.slice(3, 13)).slice(0, NIGERIAN_PHONE_LENGTH)
  }
  if (digits.startsWith('0')) {
    return NIGERIAN_PREFIX + digits.slice(1, 11)
  }
  if (digits.length >= 10) {
    return NIGERIAN_PREFIX + digits.slice(-10)
  }
  return NIGERIAN_PREFIX + digits
}

/**
 * Validate phone (boolean). Accepts 10–13 digits after cleaning; normalized form must be 234 + 10 digits.
 */
export function validatePhone(phone: string): boolean {
  const result = validatePhoneWithReason(phone)
  return result.valid
}

export interface PhoneValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validate phone with reason (for lead-validator and error messages).
 * Requires exactly 234 + 10 digits; rejects all-zeros and all-ones.
 */
export function validatePhoneWithReason(phone: string): PhoneValidationResult {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 10 || cleaned.length > 13) {
    return { valid: false, reason: `Invalid length: ${cleaned.length} (expected 10–13 digits)` }
  }
  const normalized = normalizePhone(phone)
  if (normalized.length !== NIGERIAN_PHONE_LENGTH) {
    return { valid: false, reason: `Invalid format (expected 234 + 10 digits)` }
  }
  if (!normalized.startsWith(NIGERIAN_PREFIX)) {
    return { valid: false, reason: 'Must start with 234' }
  }
  const last10 = normalized.slice(3)
  if (/^0{10}$/.test(last10)) {
    return { valid: false, reason: 'All zeros' }
  }
  if (/^1{10}$/.test(last10)) {
    return { valid: false, reason: 'All ones' }
  }
  return { valid: true }
}
