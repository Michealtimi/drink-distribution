/**
 * Centralized email validation.
 * Used by lead/contact validation and extract-contacts.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email format (basic RFC-style).
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  return EMAIL_REGEX.test(email.trim())
}
