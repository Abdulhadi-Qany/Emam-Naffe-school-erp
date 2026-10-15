/**
 * HTTP helpers for the v1 API lane.
 *
 * The wire format matches the existing hand-written routes (`app/api/**`):
 *  - collections: `{ data, pagination: { page, limit, total, totalPages, hasMore } }`
 *  - single records: the raw record (or `{ message }` for deletes)
 *  - errors: `{ error: string, code?, details? }` with a proper status
 *
 * The v2 lane uses `StudentPresenter`'s `{ success, data, error, timestamp }`
 * envelope and is deliberately kept separate.
 */

import { NextResponse } from 'next/server'
import { paginationMeta, type Pagination } from './pagination'

export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 })
}

export function deleted(message = 'Record deleted successfully'): NextResponse<{ message: string }> {
  return NextResponse.json({ message })
}

export function paged<T>(data: T[], pagination: Pagination, total: number | { count: number }) {
  const totalCount = typeof total === 'number' ? total : Number(total.count)
  return NextResponse.json({ data, pagination: paginationMeta(pagination, totalCount) })
}

export function fail(
  message: string,
  status = 400,
  code?: string,
  details?: unknown
): NextResponse<{ error: string; code?: string; details?: unknown }> {
  return NextResponse.json({ error: message, ...(code ? { code } : {}), ...(details ? { details } : {}) }, { status })
}

export function badRequest(message: string, code = 'BAD_REQUEST', details?: unknown): NextResponse {
  return fail(message, 400, code, details)
}

export function unauthorized(message = 'Authentication required'): NextResponse {
  return fail(message, 401, 'UNAUTHORIZED')
}

export function forbidden(message = 'Insufficient permissions'): NextResponse {
  return fail(message, 403, 'FORBIDDEN')
}

export function notFound(message = 'Record not found'): NextResponse {
  return fail(message, 404, 'NOT_FOUND')
}

export function conflict(message: string, code = 'CONFLICT', details?: unknown): NextResponse {
  return fail(message, 409, code, details)
}

export function unprocessable(message: string, code = 'BUSINESS_RULE', details?: unknown): NextResponse {
  return fail(message, 422, code, details)
}

/** Maps thrown errors to responses — MoneyValidationError → 400, everything else → 500. */
export function serverError(error: unknown, context?: string): NextResponse<{ error: string }> {
  const prefix = context ? `${context}: ` : ''
  console.error(prefix, error)
  if (error instanceof Error && error.name === 'MoneyValidationError') {
    return fail(error.message, 400, 'INVALID_AMOUNT')
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
