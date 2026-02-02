import { NextResponse } from 'next/server'

/**
 * Structured API error codes for consistent client handling and monitoring.
 */
export const ApiErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode]

export interface ApiErrorPayload {
  error: string
  code?: ApiErrorCodeType
  message?: string
  details?: unknown
}

/**
 * Return a JSON error response with optional code and details.
 */
export function apiError(
  error: string,
  status: number,
  options?: { code?: ApiErrorCodeType; message?: string; details?: unknown }
): NextResponse {
  const body: ApiErrorPayload = {
    error,
    ...(options?.code && { code: options.code }),
    ...(options?.message && { message: options.message }),
    ...(options?.details !== undefined && { details: options.details }),
  }
  return NextResponse.json(body, { status })
}

/** 400 Bad Request */
export function badRequest(error: string, details?: unknown) {
  return apiError(error, 400, { code: ApiErrorCode.BAD_REQUEST, details })
}

/** 404 Not Found */
export function notFound(error: string) {
  return apiError(error, 404, { code: ApiErrorCode.NOT_FOUND })
}

/** 409 Conflict */
export function conflict(error: string, details?: unknown) {
  return apiError(error, 409, { code: ApiErrorCode.CONFLICT, details })
}

/** 500 Internal */
export function internalError(error: string, message?: string) {
  return apiError(error, 500, {
    code: ApiErrorCode.INTERNAL_ERROR,
    message: message || error,
  })
}

/** 503 Service Unavailable (e.g. DB down) */
export function serviceUnavailable(error: string, message?: string, details?: unknown) {
  return apiError(error, 503, {
    code: ApiErrorCode.DATABASE_UNAVAILABLE,
    message: message || error,
    details,
  })
}

/** 503 Timeout */
export function timeout(error: string) {
  return apiError(error, 503, { code: ApiErrorCode.TIMEOUT })
}
