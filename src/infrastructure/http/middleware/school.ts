import type { NextRequest } from 'next/server'

export const DEFAULT_SCHOOL_ID =
  process.env.DEFAULT_SCHOOL_ID || 'emam-bukhari-private-school'

/**
 * Resolves the school scope for a request:
 * 1. `x-school-id` header
 * 2. `schoolId` query parameter
 * 3. DEFAULT_SCHOOL_ID
 */
export function resolveSchoolId(request: NextRequest): string {
  return (
    request.headers.get('x-school-id') ||
    request.nextUrl.searchParams.get('schoolId') ||
    DEFAULT_SCHOOL_ID
  )
}
