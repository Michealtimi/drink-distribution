/**
 * WhatsApp client using whatsapp-web.js with LocalAuth (session persistence).
 * Run your Node/Next server and scan the QR once in the terminal; session is saved in .wwebjs_auth/
 *
 * RATE LIMIT: Do not send more than ~50 messages per hour per number to avoid
 * WhatsApp bans. Use a rate limiter or queue if sending to many leads.
 */

const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

let client = null
let isReady = false

/** Get Chrome/Chromium path: use PUPPETEER_EXECUTABLE_PATH, or Puppeteer's bundled Chrome if available. */
function getChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }
  try {
    const puppeteer = require('puppeteer')
    return puppeteer.executablePath()
  } catch {
    return undefined
  }
}

function getClient() {
  if (client) return client
  const executablePath = getChromePath()
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: '.wwebjs_auth',
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...(executablePath ? { executablePath } : {}),
    },
  })

  client.on('qr', (qr) => {
    console.log('[WhatsApp] Scan this QR with your phone (Linked Devices):')
    qrcode.generate(qr, { small: true })
  })

  client.on('ready', () => {
    isReady = true
    console.log('[WhatsApp] Client is ready. You can send messages.')
  })

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Auth failure:', msg)
  })

  client.initialize().catch((err) => {
    console.error('[WhatsApp] Initialize error:', err)
  })

  return client
}

/**
 * Sanitize phone for WhatsApp JID: digits only, Nigerian format (234...), then append @c.us
 * @param {string} number - Raw phone (e.g. +234 801 234 5678, 08012345678)
 * @returns {string} JID e.g. 2348012345678@c.us
 */
function toJid(number) {
  const digits = (number || '').replace(/\D/g, '').trim()
  if (!digits.length) return ''
  let normalized = digits
  if (normalized.startsWith('0')) {
    normalized = '234' + normalized.slice(1)
  } else if (!normalized.startsWith('234')) {
    normalized = '234' + normalized
  }
  if (normalized.length > 13) normalized = normalized.slice(0, 13)
  return normalized + '@c.us'
}

/**
 * Send a WhatsApp text message.
 * @param {string} number - Phone number (with or without +234, spaces, etc.)
 * @param {string} message - Text to send
 * @returns {Promise<object>} Sent message info or throws
 */
async function sendWhatsApp(number, message) {
  const jid = toJid(number)
  if (!jid) {
    throw new Error('Invalid or empty phone number')
  }
  const c = getClient()
  try {
    const result = await c.sendMessage(jid, message)
    return result
  } catch (err) {
    console.error('[WhatsApp] sendMessage failed:', err.message)
    throw err
  }
}

function isClientReady() {
  return isReady
}

/**
 * Check if a number is registered on WhatsApp.
 * Uses getNumberId (may return null for some registered numbers - library quirk).
 * @param {string} number - Phone (e.g. 2348012345678 or 08012345678)
 * @returns {Promise<boolean>} true if number appears registered
 */
async function checkNumberRegistered(number) {
  const jid = toJid(number)
  if (!jid) return false
  const c = getClient()
  try {
    const id = jid.replace('@c.us', '')
    const numberId = await c.getNumberId(id)
    return !!numberId
  } catch (err) {
    console.warn('[WhatsApp] checkNumberRegistered failed:', err?.message || err)
    return false
  }
}

module.exports = {
  getClient,
  sendWhatsApp,
  toJid,
  isClientReady,
  checkNumberRegistered,
}
