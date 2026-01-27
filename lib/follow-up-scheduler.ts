import { prisma } from './prisma'
import { LeadStatus } from '@prisma/client'

/**
 * Auto-schedule follow-ups when a lead is messaged
 * Creates: Day 2, Day 5, and Month-end follow-ups
 */
export async function scheduleFollowUpsForLead(leadId: string) {
  const now = new Date()
  
  // Day 2 follow-up
  const day2 = new Date(now)
  day2.setDate(day2.getDate() + 2)
  day2.setHours(10, 0, 0, 0) // 10 AM

  // Day 5 follow-up
  const day5 = new Date(now)
  day5.setDate(day5.getDate() + 5)
  day5.setHours(10, 0, 0, 0) // 10 AM

  // Month-end follow-up (last day of current month)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  monthEnd.setHours(10, 0, 0, 0)

  // Check if follow-ups already exist
  const existing = await prisma.followUp.findMany({
    where: {
      leadId,
      scheduledFor: {
        in: [day2, day5, monthEnd],
      },
    },
  })

  const existingDates = existing.map(f => f.scheduledFor.getTime())

  const followUpsToCreate = []

  if (!existingDates.includes(day2.getTime())) {
    followUpsToCreate.push({
      leadId,
      scheduledFor: day2,
      notes: 'Day 2 follow-up',
    })
  }

  if (!existingDates.includes(day5.getTime())) {
    followUpsToCreate.push({
      leadId,
      scheduledFor: day5,
      notes: 'Day 5 follow-up',
    })
  }

  if (!existingDates.includes(monthEnd.getTime())) {
    followUpsToCreate.push({
      leadId,
      scheduledFor: monthEnd,
      notes: 'Month-end reactivation',
    })
  }

  if (followUpsToCreate.length > 0) {
    await prisma.followUp.createMany({
      data: followUpsToCreate,
    })
  }

  return followUpsToCreate.length
}

/**
 * Get pending follow-ups for today
 */
export async function getPendingFollowUpsForToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await prisma.followUp.findMany({
    where: {
      completed: false,
      scheduledFor: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      lead: true,
    },
    orderBy: {
      scheduledFor: 'asc',
    },
  })
}

/**
 * Get overdue follow-ups
 */
export async function getOverdueFollowUps() {
  const now = new Date()

  return await prisma.followUp.findMany({
    where: {
      completed: false,
      scheduledFor: {
        lt: now,
      },
    },
    include: {
      lead: true,
    },
    orderBy: {
      scheduledFor: 'asc',
    },
  })
}
