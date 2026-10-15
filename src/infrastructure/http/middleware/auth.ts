// src/infrastructure/http/middleware/auth.ts
//
// The single authentication + RBAC guard shared by the Clean v2 lane and the v1
// lane (`lib/api/auth.ts` re-uses these exact exports).
//
// Two call styles, one implementation:
//   • Imperative — used by every route handler:
//       const user = await requireAuth(request)
//       await requirePermission(user.id, schoolId, 'staff:write')
//   • HOF (`withAuth`) — retained for composition-style handlers.
//
// SEC-001: no runtime role creation. Unknown users resolve to an EMPTY
//          permission set and every guard fails closed.
// SEC-002: permission payloads are strict-parsed in the domain layer before use.

import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/src/infrastructure/auth/server';
import { permissionService } from '@/src/application/auth/permission-service';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type Permission,
} from '@/src/domain/auth/permissions';

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

/** Thrown when there is no authenticated session (→ 401). */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/** Thrown when the caller lacks the required permission (→ 403). */
export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
}

export interface AuthContext {
  userId: string;
  schoolId: string | null;
  roles: readonly string[];
  permissions: readonly Permission[];
}

export interface AuthedRequest extends NextRequest {
  auth: AuthContext;
}

export type RouteHandler<Req extends NextRequest = AuthedRequest> = (
  req: Req,
  ctx: { params: Promise<Record<string, string | string[]>> },
) => Promise<Response> | Response;

export interface AuthOptions {
  /** All must be present. */
  requireAll?: Permission[];
  /** At least one must be present. */
  requireAny?: Permission[];
  /** Optional rate limit for this route. */
  rateLimit?: { name: string; windowMs: number; limit: number };
}

/* -------------------------------------------------------------------------- */
/* Imperative guards (primary API)                                            */
/* -------------------------------------------------------------------------- */

/** Resolve the current user or throw `UnauthorizedError` (401). */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const session = await getSession(request);
  if (!session?.user?.id) throw new UnauthorizedError();
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

/**
 * Assert the user holds `permission` within `schoolId`, or throw `ForbiddenError`
 * (403). Fails closed: a user with no role or no permissions is denied.
 */
export async function requirePermission(
  userId: string,
  schoolId: string,
  permission: Permission,
): Promise<void> {
  const resolved = await permissionService.resolve(userId, schoolId);
  if (resolved.roles.length === 0 || resolved.permissions.length === 0) {
    throw new ForbiddenError('No role assigned');
  }
  if (!hasPermission(resolved.permissions, permission)) {
    throw new ForbiddenError('Insufficient permissions');
  }
}

/** Assert the user holds at least one of `permissions` (→ 403 otherwise). */
export async function requireAnyPermission(
  userId: string,
  schoolId: string,
  permissions: readonly Permission[],
): Promise<void> {
  const resolved = await permissionService.resolve(userId, schoolId);
  if (resolved.roles.length === 0 || resolved.permissions.length === 0) {
    throw new ForbiddenError('No role assigned');
  }
  if (!hasAnyPermission(resolved.permissions, permissions)) {
    throw new ForbiddenError('Insufficient permissions');
  }
}


/* -------------------------------------------------------------------------- */
/* HOF wrapper (composition style)                                            */
/* -------------------------------------------------------------------------- */

export function withAuth(
  handler: RouteHandler,
  options: AuthOptions = {},
) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string | string[]>> },
  ): Promise<Response> => {
    if (options.rateLimit) {
      const { checkRateLimit, rateLimitHeaders, tooManyResponse } =
        await import('@/src/infrastructure/http/rate-limit');
      const rl = await checkRateLimit(req, options.rateLimit);
      if (!rl.allowed) return tooManyResponse(rl);
      const res = await runHandler(req, ctx, handler, options);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(rateLimitHeaders(rl))) headers.set(k, v);
      return new Response(res.body, { status: res.status, headers });
    }
    return runHandler(req, ctx, handler, options);
  };
}

async function runHandler(
  req: NextRequest,
  ctx: { params: Promise<Record<string, string | string[]>> },
  handler: RouteHandler,
  options: AuthOptions,
): Promise<Response> {
  const session = await getSession(req);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'unauthenticated', message: 'Authentication required' },
      { status: 401 },
    );
  }

  const schoolId =
    (session.session as { activeSchoolId?: string | null } | undefined)
      ?.activeSchoolId ?? null;

  let resolved;
  try {
    resolved = await permissionService.resolve(session.user.id, schoolId);
  } catch (err) {
    // Fail closed on any parse/DB error. Log sanitized.
    console.error('auth.resolve_failed', {
      userId: session.user.id,
      error: err instanceof Error ? err.message : 'unknown',
    });
    return NextResponse.json(
      { error: 'auth_error', message: 'Unable to resolve permissions' },
      { status: 500 },
    );
  }

  // FIXED: No auto-role creation - least privilege principle
  if (resolved.roles.length === 0 || resolved.permissions.length === 0) {
    return NextResponse.json(
      { error: 'forbidden', message: 'No role assigned' },
      { status: 403 },
    );
  }

  const perms = resolved.permissions;

  if (options.requireAll?.length && !hasAllPermissions(perms, options.requireAll)) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Insufficient permissions' },
      { status: 403 },
    );
  }
  if (options.requireAny?.length && !hasAnyPermission(perms, options.requireAny)) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Insufficient permissions' },
      { status: 403 },
    );
  }

  const authedReq = req as AuthedRequest;
  (authedReq as { auth: AuthContext }).auth = {
    userId: session.user.id,
    schoolId,
    roles: resolved.roles,
    permissions: perms,
  };

  return handler(authedReq, ctx);
}
