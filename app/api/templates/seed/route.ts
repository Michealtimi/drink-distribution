import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Seed WhatsApp message templates from the MASTER AUTO-MESSAGE PROMPT.
 * POST this route to create or update templates used by the message generator.
 * Note: this endpoint is intended for local/dev use.
 */
export async function POST(request: NextRequest) {
  try {
    const templates = [
      {
        name: 'MASTER AUTO-MESSAGE PROMPT',
        type: 'WHATSAPP',
        category: null,
        city: null,
        stage: 'MASTER',
        content: `You are a Lagos FMCG beverage distributor.

Products:
- Energy drinks like Red Bull GmbH
- Monster
- Event-ready cognac

Rules:
• We do NOT replace their supplier.
• We offer zero-risk trial (24 cans)
• Payment after delivery.
• Same-day Lagos delivery.
• Speak like a real Lagos distributor.
• Mention stock-outs during peak events.
• End with a clear next step.

Use this as the style guide for writing short WhatsApp outreach messages tailored to business type (Gym, Event planner, Nightclub/Lounge, Mini-Mart, Office).`,
        variables: [],
        isActive: false,
      },
      {
        name: 'WhatsApp: Gym - First Contact',
        type: 'WHATSAPP',
        category: 'GYM',
        city: null,
        stage: 'FIRST_CONTACT',
        content: `Hello {{name}},

My name is Micheal — I run a Lagos beverage distribution network supplying energy drinks like Red Bull GmbH and other quality alternatives to gyms, lounges, and event planners across Lekki, Ikeja & VI.

Most partners already have suppliers, but they still face stock-outs during busy weekends, fitness events, weddings, and last-minute bookings.
We don’t replace your supplier — we act as a fast backup so you never lose sales or disappoint guests.

I’d love to offer one small zero-risk trial delivery (1 mixed carton, pay after delivery) so you can test our speed and reliability for your next event or peak day.

Would tomorrow or Friday work for a quick trial?

Thank you 🙏
Micheal
Same-day Lagos delivery`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
      {
        name: 'WhatsApp: Event Planner - First Contact',
        type: 'WHATSAPP',
        category: 'EVENT_CENTER',
        city: null,
        stage: 'FIRST_CONTACT',
        content: `Hello {{name}},

My name is Micheal — I run a Lagos beverage distribution network supplying energy drinks like Red Bull GmbH and other quality alternatives to gyms, lounges, and event planners across Lekki, Ikeja & VI.

Most partners already have suppliers, but they still face stock-outs during busy weekends, fitness events, weddings, and last-minute bookings.
We don’t replace your supplier — we act as a fast backup so you never lose sales or disappoint guests.

I’d love to offer one small zero-risk trial delivery (1 mixed carton, pay after delivery) so you can test our speed and reliability for your next event or peak day.

Would tomorrow or Friday work for a quick trial?

Thank you 🙏
Micheal
Same-day Lagos delivery`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
      {
        name: 'WhatsApp: Nightclub/Lounge - First Contact',
        type: 'WHATSAPP',
        category: 'LOUNGE',
        city: null,
        stage: 'FIRST_CONTACT',
        content: `Hello {{name}},

My name is Micheal — I run a Lagos beverage distribution network supplying energy drinks like Red Bull GmbH and other quality alternatives to gyms, lounges, and event planners across Lekki, Ikeja & VI.

Most partners already have suppliers, but they still face stock-outs during busy weekends, fitness events, weddings, and last-minute bookings.
We don’t replace your supplier — we act as a fast backup so you never lose sales or disappoint guests.

I’d love to offer one small zero-risk trial delivery (1 mixed carton, pay after delivery) so you can test our speed and reliability for your next event or peak day.

Would tomorrow or Friday work for a quick trial?

Thank you 🙏
Micheal
Same-day Lagos delivery`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
      {
        name: 'WhatsApp: Club - First Contact',
        type: 'WHATSAPP',
        category: 'CLUB',
        city: null,
        stage: 'FIRST_CONTACT',
        content: `Hello {{name}},

I supply fast-moving energy drinks like Red Bull GmbH and cognac to clubs across Lekki & VI so they never run out during weekend rush.

We don’t replace your supplier — we support you on peak nights and big events where stockouts happen.

Can I deliver a trial carton before this weekend?`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
      {
        name: 'WhatsApp: Mini-Mart - First Contact',
        type: 'WHATSAPP',
        category: 'SMALL_RETAILER',
        city: null,
        stage: 'FIRST_CONTACT',
        content: `Hello {{name}},

I supply fast-moving drinks like Red Bull GmbH to mini-markets across Lagos to help increase basket size.

Small trial cartons available, pay after delivery.

Should I add your shop to Thursday route?`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
      {
        name: 'WhatsApp: Office - First Contact',
        type: 'WHATSAPP',
        category: 'OFFICE',
        city: null,
        stage: 'FIRST_CONTACT',
        content: `Hello {{name}},

We supply energy drinks like Red Bull GmbH for staff refreshment and corporate events across Lagos.

Can I drop a small trial pack for your team this week?`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
      // Follow-ups (generic)
      {
        name: 'WhatsApp: Follow-up Day 2 - Generic',
        type: 'WHATSAPP',
        category: null,
        city: null,
        stage: 'FOLLOW_UP_DAY_2',
        content: `Hi {{name}}, just following up on my message.

Even if you don't need anything now, we're happy to support as a backup supplier whenever demand increases.

Would you be open to a small, zero-risk trial delivery so you have an alternative when demand spikes?`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
      {
        name: 'WhatsApp: Follow-up Day 5 - Generic',
        type: 'WHATSAPP',
        category: null,
        city: null,
        stage: 'FOLLOW_UP_DAY_5',
        content: `Hi {{name}}, just checking in again.

If now isn't a good time, no problem — we're here when you need a reliable backup drinks supplier.

Would you like a small trial delivery to test our speed?`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
      {
        name: 'WhatsApp: Month End - Generic',
        type: 'WHATSAPP',
        category: null,
        city: null,
        stage: 'MONTH_END',
        content: `Hi {{name}}, checking in before month-end. Still open to having a backup drinks supplier? We can do a small trial whenever you're ready.`,
        variables: ['name', 'category', 'city', 'area'],
        isActive: true,
      },
    ] as const

    // Create or update templates
    const results = []
    for (const t of templates) {
      const existing = await prisma.messageTemplate.findFirst({ where: { name: t.name } })
      if (existing) {
        const updated = await prisma.messageTemplate.update({ where: { id: existing.id }, data: t as any })
        results.push({ name: t.name, action: 'updated', id: updated.id })
      } else {
        const created = await prisma.messageTemplate.create({ data: t as any })
        results.push({ name: t.name, action: 'created', id: created.id })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error seeding templates:', error)
    return NextResponse.json({ success: false, error: 'Failed to seed templates' }, { status: 500 })
  }
}
