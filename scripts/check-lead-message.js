const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function replaceVariables(template, context) {
  let result = template
  result = result.replace(/\{\{name\}\}/g, context.name)
  result = result.replace(/\{\{category\}\}/g, context.category || '')
  result = result.replace(/\{\{city\}\}/g, context.city || '')
  result = result.replace(/\{\{area\}\}/g, context.area || '')
  return result
}

async function main() {
  const lead = await prisma.lead.findFirst({ where: { category: 'GYM' } })
  if (!lead) {
    console.log('No GYM lead found')
    return
  }

  console.log('Using lead:', { id: lead.id, name: lead.name, category: lead.category, city: lead.city, area: lead.area })

  const type = 'WHATSAPP'
  const stage = 'FIRST_CONTACT'

  const where = { type, stage, isActive: true }
  const AND = []
  if (lead.category) AND.push({ OR: [{ category: lead.category }, { category: null }] })
  if (lead.city) AND.push({ OR: [{ city: lead.city }, { city: null }] })
  if (AND.length) where.AND = AND

  const template = await prisma.messageTemplate.findFirst({ where, orderBy: { createdAt: 'desc' } })

  if (template) {
    const message = replaceVariables(template.content, { name: lead.name, category: lead.category, city: lead.city, area: lead.area || '' })
    console.log('Template used:', template.name)
    console.log('Message:\n')
    console.log(message)
  } else {
    console.log('No template found — fallback would run')
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
