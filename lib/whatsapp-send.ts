/**
 * Thin wrapper so the app can import sendWhatsApp from TypeScript.
 * The real client lives in whatsappClient.js (CommonJS).
 *
 * RATE LIMIT: Do not send more than ~50 messages per hour to avoid WhatsApp bans.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const whatsappClient = require('./whatsappClient.js') as {
  sendWhatsApp: (number: string, message: string) => Promise<unknown>
  isClientReady: () => boolean
  checkNumberRegistered: (number: string) => Promise<boolean>
}

export const sendWhatsApp = whatsappClient.sendWhatsApp
export const isClientReady = whatsappClient.isClientReady
export const checkNumberRegistered = whatsappClient.checkNumberRegistered
