import { CustomerType, City, LeadStatus } from '@prisma/client'
import { prisma } from './prisma'

interface MessageContext {
  name: string
  category: CustomerType
  city: City
  area?: string
  isFollowUp?: boolean
  followUpDay?: number
  isMonthEnd?: boolean
}

const categoryNames: Record<CustomerType, string> = {
  DISTRIBUTOR: 'distributor',
  SUPPLIER: 'supplier',
  CONSUMER: 'consumer',
  GYM: 'gym',
  EVENT_CENTER: 'event center',
  CLUB: 'club',
  LOUNGE: 'lounge',
  OFFICE: 'office',
  SMALL_RETAILER: 'retailer',
  OTHER: 'business',
}

const cityNames: Record<City, string> = {
  LAGOS: 'Lagos',
  ABUJA: 'Abuja',
}

/**
 * Generate first outreach message
 * Sound: Human, Confident, Operationally credible
 * Emphasize: Reliability, No stock-outs, Trial delivery, Zero risk
 */
export function generateFirstMessage(context: MessageContext): string {
  const { name, category, city, area } = context
  const categoryName = categoryNames[category]
  const cityName = cityNames[city]
  const areaText = area ? ` in ${area}` : ''

  // Natural keyword integration - never forced
  const cityKeyword = city === City.LAGOS ? 'Lagos' : 'Abuja'
  
  const messages = [
    `Hi ${name}, I'm reaching out to ${categoryName}s${areaText} in ${cityName} about energy drink supply.`,

    `We're a reliable energy drink distributor in ${cityName}, specializing in Red Bull and premium energy drinks for ${categoryName}s.`,

    `What we offer: trial delivery of 24-48 cans, payment after delivery (within 48 hours), and consistent stock availability.`,

    `No upfront payment required. We deliver, you pay after you've received the products.`,

    `Would you like to schedule a trial delivery this week? I can confirm quantity and delivery day.`,
  ]

  return messages.join('\n\n')
}

/**
 * Generate follow-up message
 * Must: Be short, Be polite, Always propose a specific next step
 */
export function generateFollowUpMessage(context: MessageContext): string {
  const { name, category, city, followUpDay, isMonthEnd } = context
  const categoryName = categoryNames[category]
  const cityName = cityNames[city]

  if (isMonthEnd) {
    return `Hi ${name}, checking in before month-end. Still interested in energy drink supply for your ${categoryName}? We can schedule a trial delivery next week. What day works for you?`
  }

  if (followUpDay === 2) {
    return `Hi ${name}, following up on energy drink supply for your ${categoryName}. Ready to schedule a trial delivery? We can do 24-48 cans, payment after delivery. What day this week works?`
  }

  if (followUpDay === 5) {
    return `Hi ${name}, still interested in energy drinks? We're available for trial delivery in ${cityName} - 24-48 cans, pay after delivery. Let me know if you'd like to proceed.`
  }

  // Generic follow-up
  return `Hi ${name}, checking in about energy drink supply. Ready to schedule a trial? We deliver 24-48 cans, payment after delivery. What day works for you?`
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(template: string, context: MessageContext): string {
  const categoryNames: Record<CustomerType, string> = {
    DISTRIBUTOR: 'distributor',
    SUPPLIER: 'supplier',
    CONSUMER: 'consumer',
    GYM: 'gym',
    EVENT_CENTER: 'event center',
    CLUB: 'club',
    LOUNGE: 'lounge',
    OFFICE: 'office',
    SMALL_RETAILER: 'retailer',
    OTHER: 'business',
  }

  const cityNames: Record<City, string> = {
    LAGOS: 'Lagos',
    ABUJA: 'Abuja',
  }

  let result = template
  result = result.replace(/\{\{name\}\}/g, context.name)
  result = result.replace(/\{\{category\}\}/g, categoryNames[context.category])
  result = result.replace(/\{\{city\}\}/g, cityNames[context.city])
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
