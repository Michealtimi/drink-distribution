import { CustomerType, City, LeadStatus } from '@prisma/client'
import { prisma } from './prisma'
import { CATEGORY_DISPLAY_NAMES, CITY_DISPLAY_NAMES } from './constants/display-names'
import { CATEGORY_MESSAGE_VARIANT } from './segment-config'

interface MessageContext {
  name: string
  category: CustomerType
  city: City
  area?: string
  isFollowUp?: boolean
  followUpDay?: number
  isMonthEnd?: boolean
}

const cityNameForMessage = (city: City) => (city === City.LAGOS ? 'Lagos' : 'Abuja')

/** Universal first message (best conversion — TARGET_SEGMENTS_AND_GO_TO_MARKET.md) */
function universalFirstMessage(name: string, city: City): string {
  const cityLabel = cityNameForMessage(city)
  return `Hello ${name},

I work with a beverage distribution team supplying energy drinks (Red Bull + alternatives) and event-focused drinks to businesses in ${cityLabel}.

Most gyms, lounges, and event venues we speak with already have suppliers — but still experience stockouts during busy periods or last-minute demand.

We're not asking you to switch.

We simply support businesses as a reliable backup supplier for peak days and events.

Would you be open to a small, zero-risk trial delivery so you have an alternative when demand spikes?`
}

/** Nightclub / Lounge first message */
function nightclubFirstMessage(name: string, area?: string): string {
  const areaLabel = area ? area : 'your area'
  return `Hi ${name},

I supply energy drinks and cognac to lounges and event venues in ${areaLabel}.

A lot of venues already have suppliers — but still lose sales on Friday/Saturday nights when stock runs out or delivery delays happen.

We work as a backup supplier for peak nights, not a replacement.

Would it help to have an extra supply option available when the bar is moving fast?`
}

/** Event planner first message */
function eventPlannerFirstMessage(name: string): string {
  return `Hello ${name},

I support event planners and venues with energy drinks and cognac supply for weddings, concerts, and corporate events.

We focus on last-minute reliability — when demand changes close to the event date.

Would you like a supplier you can call when quantities increase unexpectedly?`
}

/**
 * Generate first outreach message (cold WhatsApp).
 * Uses segment-based copy from TARGET_SEGMENTS_AND_GO_TO_MARKET.md for best conversion.
 */
export function generateFirstMessage(context: MessageContext): string {
  const { name, category, city, area } = context
  const variant = CATEGORY_MESSAGE_VARIANT[category]

  if (variant === 'NIGHTCLUB') return nightclubFirstMessage(name, area)
  if (variant === 'EVENT_PLANNER') return eventPlannerFirstMessage(name)
  return universalFirstMessage(name, city)
}

/**
 * Generate follow-up message (Day 3–5 style — TARGET_SEGMENTS_AND_GO_TO_MARKET.md).
 * Short, no pressure, soft yes/no.
 */
export function generateFollowUpMessage(context: MessageContext): string {
  const { name, followUpDay, isMonthEnd } = context

  const standardFollowUp = `Hi ${name}, just following up on my message.

Even if you don't need anything now, we're happy to support as a backup supplier whenever demand increases.

Would you be open to a small, zero-risk trial delivery so you have an alternative when demand spikes?`

  if (isMonthEnd) {
    return `Hi ${name}, checking in before month-end. Still open to having a backup drinks supplier? We can do a small trial whenever you're ready.`
  }

  if (followUpDay === 2 || followUpDay === 5) {
    return standardFollowUp
  }

  return standardFollowUp
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(template: string, context: MessageContext): string {
  let result = template
  result = result.replace(/\{\{name\}\}/g, context.name)
  result = result.replace(/\{\{category\}\}/g, CATEGORY_DISPLAY_NAMES[context.category])
  result = result.replace(/\{\{city\}\}/g, CITY_DISPLAY_NAMES[context.city])
  result = result.replace(/\{\{area\}\}/g, context.area || '')
  return result
}

/**
 * Get template from database or fallback to hardcoded
 */
async function getTemplate(
  type: 'WHATSAPP' | 'EMAIL',
  stage: string,
  category?: CustomerType,
  city?: City
): Promise<string | null> {
  try {
    const template = await prisma.messageTemplate.findFirst({
      where: {
        type,
        stage,
        isActive: true,
        ...(category && { category }),
        ...(city && { city }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return template?.content || null
  } catch (error) {
    console.error('Error fetching template:', error)
    return null
  }
}

export interface GenerateMessageResult {
  content: string
  fromTemplate: boolean
}

/**
 * Generate message based on lead status and context (uses templates from DB).
 * Returns content and whether it came from DB template (for visibility when fallback is used).
 */
export async function generateMessage(
  status: LeadStatus,
  context: MessageContext
): Promise<GenerateMessageResult> {
  let stage = 'FIRST_CONTACT'
  if (status === LeadStatus.MESSAGED || status === LeadStatus.INTERESTED) {
    if (context.isMonthEnd) {
      stage = 'MONTH_END'
    } else if (context.followUpDay === 2) {
      stage = 'FOLLOW_UP_DAY_2'
    } else if (context.followUpDay === 5) {
      stage = 'FOLLOW_UP_DAY_5'
    } else {
      stage = 'FOLLOW_UP_DAY_2'
    }
  }

  const template = await getTemplate('WHATSAPP', stage, context.category, context.city)
  if (template) {
    return { content: replaceVariables(template, context), fromTemplate: true }
  }

  if (status === LeadStatus.MESSAGED || status === LeadStatus.INTERESTED) {
    return { content: generateFollowUpMessage(context), fromTemplate: false }
  }
  return { content: generateFirstMessage(context), fromTemplate: false }
}

/**
 * Get WhatsApp link for message
 */
export function getWhatsAppLink(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message)
  const cleanPhone = phone.replace(/\D/g, '') // Remove non-digits
  const phoneWithCountryCode = cleanPhone.startsWith('234') 
    ? cleanPhone 
    : `234${cleanPhone.replace(/^0/, '')}` // Add Nigeria country code if missing
  
  return `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`
}
