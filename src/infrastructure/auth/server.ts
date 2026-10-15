// src/infrastructure/auth/server.ts
//
// Better Auth adapter for the Clean/DDD HTTP layer.
//
// The middleware (`src/infrastructure/http/middleware/auth.ts`) depends only on
// this port — it never imports the better-auth SDK directly. Swapping the auth
// provider later means changing only this file.

import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export interface ServerSessionUser {
  id: string
  email?: string | null
  name?: string | null
}

export interface ServerSession {
  user: ServerSessionUser
  session: Record<string, unknown> & { activeSchoolId?: string | null }
}

/**
 * Resolve the current session for a request, or `null` when unauthenticated.
 * Thin pass-through to better-auth; all error handling lives in the caller so
 * this stays a pure adapter.
 */
export async function getSession(
  request: NextRequest,
): Promise<ServerSession | null> {
  const result = await auth.api.getSession({ headers: request.headers })
  if (!result?.user?.id) return null
  return {
    user: {
      id: result.user.id,
      email: result.user.email ?? null,
      name: result.user.name ?? null,
    },
    session: (result.session ?? {}) as ServerSession['session'],
  }
}

export default getSession
