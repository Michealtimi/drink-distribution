/**
 * Structured logger for request/job tracing.
 * Use requestId for API routes, jobId for scrapers and background jobs.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogContext {
  requestId?: string
  jobId?: string
  leadId?: string
  [key: string]: string | number | boolean | undefined
}

function formatPayload(level: LogLevel, message: string, context?: LogContext): string {
  const ts = new Date().toISOString()
  const ctx = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : ''
  return `[${ts}] [${level.toUpperCase()}] ${message}${ctx}`
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  const payload = formatPayload(level, message, context)
  if (level === 'error') console.error(payload)
  else if (level === 'warn') console.warn(payload)
  else console.log(payload)
}

export const logger = {
  info(message: string, context?: LogContext) {
    log('info', message, context)
  },
  warn(message: string, context?: LogContext) {
    log('warn', message, context)
  },
  error(message: string, context?: LogContext) {
    log('error', message, context)
  },
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') log('debug', message, context)
  },
  /** Create a child logger with fixed context (e.g. requestId or jobId). */
  child(context: LogContext) {
    return {
      info: (msg: string, extra?: LogContext) =>
        logger.info(msg, { ...context, ...extra }),
      warn: (msg: string, extra?: LogContext) =>
        logger.warn(msg, { ...context, ...extra }),
      error: (msg: string, extra?: LogContext) =>
        logger.error(msg, { ...context, ...extra }),
      debug: (msg: string, extra?: LogContext) =>
        logger.debug(msg, { ...context, ...extra }),
    }
  },
}

/** Generate a short request id (e.g. for x-request-id header). */
export function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
