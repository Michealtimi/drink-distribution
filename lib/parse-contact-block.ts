import { normalizePhone, validatePhone } from './phone-utils'

/**
 * Nigerian phone pattern: +234/234/0 followed by 10 digits (with optional spaces/dashes).
 * Matches a single number in a block of text so we don't capture building numbers (e.g. "Plot 123").
 */
const NIGERIAN_PHONE_REGEX =
  /(?:\+?234|0)\s*[\-.]?\s*[789]\d{2}\s*[\-.]?\s*\d{3}\s*[\-.]?\s*\d{4}/g

/**
 * Extract one Nigerian phone and clean address from a block of text (e.g. "12 Victoria Island, 08012345678").
 * Use when scrapers get combined address + phone in one string so the number is sorted accurately
 * and the address doesn't contain the phone (or vice versa).
 */
export function parsePhoneAndAddress(blockText: string): { phone: string; address: string } {
  const text = (blockText || '').trim()
  if (!text) return { phone: '', address: '' }

  let phone = ''
  let address = text

  const matches = text.match(NIGERIAN_PHONE_REGEX)
  if (matches && matches.length > 0) {
    // Prefer the first match that validates as a full Nigerian number
    for (const m of matches) {
      const normalized = normalizePhone(m)
      if (validatePhone(normalized)) {
        phone = normalized
        // Remove this phone from the text to form address (and any other phone-like fragments)
        address = text
          .replace(m, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        // Remove trailing/leading commas and dashes
        address = address.replace(/^[\s,\-]+|[\s,\-]+$/g, '').trim()
        break
      }
    }
  }

  // If we didn't find a valid phone, don't put a building number in phone
  if (!phone && address) {
    // Cap address length
    address = address.slice(0, 300).trim()
  }

  return { phone, address }
}
