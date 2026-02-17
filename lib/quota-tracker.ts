/**
 * Quota Tracker Utility
 *
 * Estimates usage based on leads imported (e.g. for internal scrapers or future integrations).
 * Optional: quota limit hours and leads-per-hour can be configured.
 */

export interface QuotaUsage {
  month: string // Format: "YYYY-MM"
  hoursUsed: number
  leadsImported: number
  quotaLimit: number // Default: 2.0 hours
  daysRemaining: number
  percentageUsed: number
}

/**
 * Calculate quota usage for the current month
 */
export function calculateQuotaUsage(
  leadsImported: number,
  quotaLimit: number = 2.0,
  leadsPerHour: number = 150
): Omit<QuotaUsage, 'month' | 'daysRemaining'> {
  const hoursUsed = leadsImported / leadsPerHour
  const percentageUsed = (hoursUsed / quotaLimit) * 100

  return {
    hoursUsed: Math.round(hoursUsed * 100) / 100,
    leadsImported,
    quotaLimit,
    percentageUsed: Math.round(percentageUsed * 100) / 100,
  }
}

/**
 * Get days remaining in current month
 */
export function getDaysRemainingInMonth(): number {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, daysRemaining)
}

/**
 * Get current month string (YYYY-MM format)
 */
export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Check if quota is approaching limit
 * Returns true if usage is >= 75% of limit
 */
export function isQuotaWarning(percentageUsed: number, warningThreshold: number = 75): boolean {
  return percentageUsed >= warningThreshold
}

/**
 * Check if quota is exceeded
 */
export function isQuotaExceeded(percentageUsed: number): boolean {
  return percentageUsed >= 100
}
