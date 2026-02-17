# WhatsApp Integration – Plan & Implementation Guide

**Context:** Add a **free** WhatsApp integration to the Sales Distribution CRM using `whatsapp-web.js`, with session persistence (scan once), QR in console, and optional automatic Welcome message when a new lead is created.

---

## 1. High-Level Audit (What You Have Today)

| Area | Current state | Relevance to WhatsApp |
|------|----------------|-----------------------|
| **Messaging** | Manual only: `getWhatsAppLink(phone, message)` returns `wa.me` links; user copies message and opens link. No server-side sending. | WhatsApp client will add **programmatic send**; keep wa.me as fallback. |
| **Lead creation** | `POST /api/leads` creates lead (Prisma); no side effects like email or WhatsApp. | Hook here to optionally send Welcome via WhatsApp after create. |
| **Message content** | `lib/message-generator.ts`: `generateFirstMessage()`, `generateFollowUpMessage()`, `generateMessage()` (DB templates). | Reuse for Welcome text; same tone (human, no hype, clear CTA). |
| **Phone format** | `lib/phone-utils.ts`: `normalizePhone()` → Nigerian 234 + 10 digits. | Use for sanitization before sending; JID = normalized + `@c.us`. |
| **Stack** | Next.js 14, TypeScript, Prisma, Playwright (scrapers). | whatsapp-web.js uses **Puppeteer** (separate dep); runs in Node only, not Edge/Vercel serverless. |

**Conclusion:** Integration is straightforward: add client (session + send), then call `sendWhatsApp(phone, welcomeMessage)` after `prisma.lead.create` when phone exists and feature is enabled.

---

## 2. What to Expect (Reality Check)

- **First run:** You must scan the QR code once (terminal or a future small “Connect WhatsApp” page). Session is stored in `.wwebjs_auth/` (LocalAuth). After that, restarts do **not** require a new scan unless you log out or clear the folder.
- **Environment:** This setup is for **self-hosted / Node server** (e.g. `pnpm dev` or `pnpm start` on a VPS). It will **not** run on Vercel/serverless (Puppeteer + long-lived socket).
- **Rate limits:** WhatsApp can ban numbers that send too many messages. **Stay under ~50 messages per hour** (see safety section below). For bulk outreach, keep using “Copy + Open WhatsApp” or spread sends over time.
- **Reliability:** If the Node process restarts, the client reconnects using the saved session; no QR unless session is invalid. Occasional disconnects (network/WhatsApp) may require a restart.

---

## 3. Implementation Plan

### Step 1 – Install dependencies

```bash
pnpm add whatsapp-web.js qrcode-terminal
```

- `whatsapp-web.js`: client (Puppeteer, session, send).
- `qrcode-terminal`: print QR in console for first-time auth.

### Step 2 – Client file (`lib/whatsappClient.js`)

- Use **LocalAuth** for persistence (session in `.wwebjs_auth/`).
- Puppeteer launch args: `--no-sandbox` (and optionally `--disable-setuid-sandbox`) for Linux/Docker.
- **QR:** On `qr` event, display in console via `qrcode-terminal`.
- **Ready:** On `ready`, log success (e.g. “WhatsApp client ready”).
- **Export:** `sendWhatsApp(number, message)`:
  - Sanitize number (strip non-digits, ensure Nigerian format if you like; append `@c.us` for JID).
  - `client.sendMessage(jid, message)` in try/catch; return or throw so the CRM can log/handle errors.

### Step 3 – Integration point (new lead)

- In `POST /api/leads` (after `prisma.lead.create`):
  - If lead has a valid **phone** (and optionally an env flag like `WHATSAPP_WELCOME_ENABLED=true`), build welcome text (e.g. `generateFirstMessage()` from message-generator) and call `sendWhatsApp(lead.phone, welcomeMessage)`.
  - Do **not** block the API response on send: either fire-and-forget (with error log) or enqueue (e.g. simple in-memory queue with a rate limiter). Prefer not blocking so lead creation stays fast.

### Step 4 – Safety and rate limit

- Add a clear **comment** in code: do not send more than ~50 messages per hour to avoid bans.
- Optionally: simple in-memory counter (e.g. last hour window) and skip or queue sends when near the limit.

### Step 5 – Optional improvements (later)

- **QR in UI:** Expose a small “Connect WhatsApp” page that runs the client in the same Node process and shows QR as image (e.g. `qrcode` package to generate PNG/base64) instead of terminal only.
- **Status API:** `GET /api/whatsapp/status` returning `{ ready: boolean }` so the UI can show “WhatsApp connected” or “Scan QR”.
- **Rate limiter:** Use a small module (e.g. sliding window) and reject or queue `sendWhatsApp` when over 50/hour.
- **Retries:** Retry once or twice on transient errors (e.g. disconnect) before giving up.

---

## 4. File / Code Map

| File | Purpose |
|------|--------|
| `lib/whatsappClient.js` | Init client (LocalAuth + Puppeteer), QR to console, ready log, `sendWhatsApp(number, message)`. |
| `app/api/leads/route.ts` | After create: if phone and welcome enabled, call `sendWhatsApp(lead.phone, welcomeMessage)` (non-blocking). |
| `lib/message-generator.ts` | Already has `generateFirstMessage()`; reuse for welcome text. |
| `lib/phone-utils.ts` | Use `normalizePhone()` for consistent format before JID. |
| `.env` / `.env.example` | Optional: `WHATSAPP_WELCOME_ENABLED=true`. |
| `.gitignore` | Ensure `.wwebjs_auth/` is ignored (session data). |

---

## 5. Safety Reminder (Copy-Paste for Code)

```text
// RATE LIMIT: Do not send more than ~50 messages per hour per number to avoid
// WhatsApp bans. Use a rate limiter or queue if sending to many leads.
```

---

## 6. Quick Start After Implementation

1. Install deps: `pnpm install` (adds `whatsapp-web.js`, `qrcode-terminal`).
2. Run `pnpm dev`. The WhatsApp client is **lazy-loaded** on first use (e.g. first lead create with welcome enabled).
3. First time you trigger it (create a lead with phone + `WHATSAPP_WELCOME_ENABLED=true`): watch the terminal for the QR code; scan with WhatsApp → Linked Devices.
4. When you see “WhatsApp client ready”, the session is saved in `.wwebjs_auth/`. Next lead creates will send the welcome message.
5. In `.env`: set `WHATSAPP_WELCOME_ENABLED=true` to enable welcome messages on new leads.
6. For production: run on a single, always-on Node process (VPS, PM2, etc.), not serverless.

---

## 7. Summary

- **Install:** `whatsapp-web.js`, `qrcode-terminal`.
- **Create:** `lib/whatsappClient.js` with LocalAuth, QR in console, ready log, and `sendWhatsApp(number, message)`.
- **Integrate:** After creating a lead in `POST /api/leads`, optionally send a welcome message via `sendWhatsApp`.
- **Safety:** Comment and enforce ~50 msg/hour; run on self-hosted Node, not serverless.

This keeps the CRM “manual first” (wa.me links still work) and adds optional, free, server-side WhatsApp sending with minimal changes and clear expectations.
