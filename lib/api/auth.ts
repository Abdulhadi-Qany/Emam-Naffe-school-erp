/**
 * Auth wrappers for the v1 API lane.
 *
 * Re-uses the exact implementation from the DDD middleware
 * (`src/infrastructure/http/middleware`) so both lanes share one auth path:
 * better-auth session → school resolution → `staff_roles` RBAC.
 *
 * Usage:
 * ```ts
 * export const GET = withV1('students:read', async ({ schoolId }, request) => {
 *   // ...
 * })
 * export const POST = withV1('students:write', async ({ user, schoolId }, request) => {
 *   // ...
 * })
 * ```
 *
 * Dynamic routes pass `context` through, so `context.params` stays a Promise
 * exactly as Next.js provides it.
 */

import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import {
  requireAuth,
  requirePermission,
  UnauthorizedError,
  ForbiddenError,
  type AuthUser,
} from '@/src/infrastructure/http/middleware'
import { resolveSchoolId } from '@/src/infrastructure/http/middleware/school'
import type { Permission } from './permissions'
import { forbidden, serverError, unauthorized } from './http'

export type { AuthUser }

export interface RouteContext {
  user: AuthUser
  schoolId: string
}

export type V1Handler<C = unknown> = (
  ctx: RouteContext,
  request: NextRequest,
  context: C
) => Promise<NextResponse>

/** Wraps a handler with session + RBAC enforcement. */
export function withV1<C = unknown>(permission: Permission, handler: V1Handler<C>) {
  return async (request: NextRequest, context?: C): Promise<NextResponse> => {
    try {
      const user = await requireAuth(request)
      const schoolId = resolveSchoolId(request)
      await requirePermission(user.id, schoolId, permission)
      return await handler({ user, schoolId }, request, context as C)
    } catch (error) {
      if (error instanceof UnauthorizedError) return unauthorized()
      if (error instanceof ForbiddenError) return forbidden(error.message)
      return serverError(error)
    }
  }
}

/**
 * Variant for routes that need a school scope before the permission check
 * (e.g. read endpoints that resolve the school from a query parameter).
 */
export function withV1AnyPermission<C = unknown>(permissions: readonly Permission[], handler: V1Handler<C>) {
  return async (request: NextRequest, context?: C): Promise<NextResponse> => {
    try {
      const user = await requireAuth(request)
      const schoolId = resolveSchoolId(request)
      let lastError: unknown = null
      for (const permission of permissions) {
        try {
          await requirePermission(user.id, schoolId, permission)
          return await handler({ user, schoolId }, request, context as C)
        } catch (error) {
          if (error instanceof ForbiddenError) {
            lastError = error
            continue
          }
          throw error
        }
      }
      throw lastError ?? new ForbiddenError(permissions[0])
    } catch (error) {
      if (error instanceof UnauthorizedError) return unauthorized()
      if (error instanceof ForbiddenError) return forbidden(error.message)
      return serverError(error)
    }
  }
}
