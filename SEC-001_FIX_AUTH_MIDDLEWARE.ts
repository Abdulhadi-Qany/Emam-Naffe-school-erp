// FIXED: src/infrastructure/http/middleware/auth.ts
// Addresses SEC-001 (Authentication Bypass) and SEC-002 (SQL Injection)

import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/infrastructure/auth/server'; // Better Auth adapter
import { permissionService } from '@/application/auth/permission-service';
import { hasAllPermissions, hasAnyPermission, type Permission } from '@/domain/auth/permissions';
import { checkRateLimit, rateLimitHeaders, tooManyResponse } from '@/infrastructure/http/rate-limit';

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
  requireAll?: Permission[];
  requireAny?: Permission[];
  rateLimit?: { name: string; windowMs: number; limit: number };
}

export function withAuth(
  handler: RouteHandler,
  options: AuthOptions = {},
) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string | string[]>> },
  ): Promise<Response> => {
    // Rate limiting (SEC-003)
    if (options.rateLimit) {
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
    // FIXED: Permission service now uses strict parsing and single JOIN query
    resolved = await permissionService.resolve(session.user.id, schoolId);
  } catch (err) {
    // Fail closed on any parse/DB error
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

// Convenience helpers
export const requirePermission = (
  perm: Permission,
  rateLimit?: AuthOptions['rateLimit']
) => (h: RouteHandler) => withAuth(h, { requireAll: [perm], rateLimit });

export const requireAnyPermission = (
  perms: Permission[],
  rateLimit?: AuthOptions['rateLimit']
) => (h: RouteHandler) => withAuth(h, { requireAny: perms, rateLimit });