/**
 * List-query parsing shared by collection endpoints.
 *
 * Keeps the wire format established by `lib/api/crud.ts`:
 * `?page=1&limit=50&query=<text>&sortBy=<field>&sortOrder=asc|desc`.
 */

import { like, or, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

export interface Pagination {
  page: number
  limit: number
  offset: number
}

export interface PaginationOptions {
  defaultLimit?: number
  maxLimit?: number
}

export function parsePagination(params: URLSearchParams, options: PaginationOptions = {}): Pagination {
  const defaultLimit = options.defaultLimit ?? 50
  const maxLimit = options.maxLimit ?? 100

  const page = Math.max(1, parseIntStrict(params.get('page'), 1) || 1)
  const rawLimit = parseIntStrict(params.get('limit'), defaultLimit) || defaultLimit
  const limit = Math.min(Math.max(1, rawLimit), maxLimit)
  return { page, limit, offset: (page - 1) * limit }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export function paginationMeta({ page, limit }: Pagination, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page * limit < total,
  }
}

function parseIntStrict(value: string | null, fallback: number): number {
  if (value === null || value === '') return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

/** Extracts only whitelisted query keys (enum-ish filters). */
export function parseFilters(params: URLSearchParams, allowed: readonly string[]): Record<string, string> {
  const filters: Record<string, string> = {}
  for (const key of allowed) {
    const value = params.get(key)
    if (value !== null && value !== '') filters[key] = value
  }
  return filters
}

/**
 * Builds a case-insensitive `LIKE` OR-condition across the given columns.
 * Pass the display columns the localized UI searches against.
 */
export function searchCondition(query: string | null, columns: readonly (PgColumn | SQL)[]): SQL | undefined {
  if (!query) return undefined
  const q = `%${query}%`
  const conditions = columns.map((column) => like(column as PgColumn, q))
  return conditions.length > 0 ? or(...conditions) : undefined
}

/** Parses `sortBy` against a whitelist, falling back to the default column. */
export function parseSort<T extends string>(
  params: URLSearchParams,
  allowed: readonly T[],
  fallback: T
): { sortBy: T; sortOrder: 'asc' | 'desc' } {
  const sortBy = params.get('sortBy')
  const sortOrder = params.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  return {
    sortBy: sortBy && (allowed as readonly string[]).includes(sortBy) ? (sortBy as T) : fallback,
    sortOrder,
  }
}
