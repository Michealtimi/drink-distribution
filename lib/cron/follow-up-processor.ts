import { getPendingFollowUpsForToday, getOverdueFollowUps } from '../follow-up-scheduler'
import { generateMessage, getWhatsAppLink } from '../message-generator'
import { prisma } from '../prisma'

/**
 * Process follow-ups for automation
 * Generates messages but does NOT auto-send (manual per master prompt)
 */
export async function processFollowUps() {
  const [pending, overdue] = await Promise.all([
    getPendingFollowUpsForToday(),
    getOverdueFollowUps(),
  ])

  const allFollowUps = [...pending, ...overdue]
  const results = []

  for (const followUp of allFollowUps) {
    try {
      // Generate message
      const message = generateMessage(followUp.lead.status, {
        name: followUp.lead.name,
        category: followUp.lead.category,
        city: followUp.lead.city,
        area: followUp.lead.area || undefined,
        followUpDay: getFollowUpDay(followUp.scheduledFor),
        isMonthEnd: isMonthEnd(followUp.scheduledFor),
      })

      const whatsappLink = getWhatsAppLink(followUp.lead.phone, message)

      // Update follow-up with generated message
      await prisma.followUp.update({
        where: { id: followUp.id },
        data: { message },
      })

      results.push({
        followUpId: followUp.id,
        leadId: followUp.lead.id,
        leadName: followUp.lead.name,
        phone: followUp.lead.phone,
        message,
        whatsappLink,
        scheduledFor: followUp.scheduledFor,
        isOverdue: overdue.some(f => f.id === followUp.id),
      })
    } catch (error) {
      console.error(`Error processing follow-up ${followUp.id}:`, error)
      results.push({
        followUpId: followUp.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    processed: results.length,
    pending: pending.length,
    overdue: overdue.length,
    results,
  }
}

/**
 * Calculate which follow-up day this is (2, 5, or month-end)
 */
function getFollowUpDay(scheduledFor: Date): number | undefined {
  const now = new Date()
  const daysDiff = Math.floor((scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 2) return 2
  if (daysDiff === 5) return 5
  return undefined
}

/**
 * Check if this is a month-end follow-up
 */
function isMonthEnd(date: Date): boolean {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return date.getDate() === lastDayOfMonth.getDate()
}
