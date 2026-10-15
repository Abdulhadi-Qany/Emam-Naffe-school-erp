# School ERP System - Security Fixes Summary

This document summarizes the complete fixes applied to address the critical security vulnerabilities and other issues identified in the audit.

## Critical Fixes (P0 - Immediate)

### SEC-001: Authentication Bypass Vulnerability
**Problem**: The auth middleware automatically created a `school_admin` role with wildcard (`["*"]`) permissions whenever a user had no existing role, allowing any authenticated user to escalate to admin privileges.

**Files Modified**:
- `src/infrastructure/http/middleware/auth.ts` - Removed auto-role creation logic
- `scripts/seed-admin.ts` - Added proper admin initialization script
- `src/domain/auth/roles.ts` - Defined canonical roles with least-privilege permissions

**Fix Details**:
- Removed the code that automatically created roles with `['*']` permissions
- Implemented least-privilege principle: users with no roles get empty permission set → access denied
- Admin provisioning now happens exclusively via `scripts/seed-admin.ts` (run once per school)
- Added proper error handling for missing roles

### SEC-002: SQL Injection in Permission Parsing
**Problem**: The permission parsing logic used `JSON.parse()` without validation, potentially allowing SQL injection if malicious data was stored in the permissions field.

**Files Modified**:
- `src/domain/auth/permissions.ts` - New file with strict permission validation
- `src/application/auth/permission-service.ts` - Uses strict parsing
- `src/infrastructure/http/middleware/auth.ts` - Updated to use new permission service

**Fix Details**:
- Created canonical permission model with strict format validation (`resource:action`, `resource:*`, or `*`)
- Implemented allowlist of known permissions
- Added length limits and JSON structure validation
- Permission parsing now throws `PermissionParseError` on any invalid input
- Fail-closed approach: invalid permissions result in 500 error, not SQL execution

### SEC-003: Missing Rate Limiting on Auth Endpoints
**Problem**: Authentication endpoints (sign-in, sign-up, password reset) were exposed without rate limiting, enabling brute force attacks.

**Files Modified**:
- `app/api/auth/[...all]/route.ts` - Added rate limiting to auth routes
- `src/infrastructure/http/rate-limit/` - New directory with complete rate limiting implementation
- `src/infrastructure/http/client-ip.ts` - Client IP extraction with proxy support

**Fix Details**:
- Implemented sliding window rate limiting with in-memory and Redis backends
- Created specific rate limit rules for different auth endpoints:
  - Sign-in: 10 attempts/minute (burst), 50 attempts/15min (sustained), 5 attempts/15min per account
  - Sign-up: 5 attempts/hour per IP
  - Password reset: 5 attempts/hour per IP
- Added proper HTTP 429 responses with Retry-After headers
- Fail-open design: if rate limiting service is unavailable, requests are allowed (with logging)

## High Priority Fixes (P1 - Short-term)

### PERF-001: N+1 Query in Permission Checking
**Problem**: Each permission check resulted in multiple database queries (separate queries for roles and permissions).

**Files Modified**:
- `src/application/auth/permission-service.ts` - New service with caching and optimized queries
- `drizzle/migrations/0001_roles_permissions_indexes.sql` - Database indexes for performance
- `src/infrastructure/http/middleware/auth.ts` - Updated to use permission service

**Fix Details**:
- Implemented single JOIN query to fetch roles and permissions in one database call
- Added LRU cache (default 60s TTL, 10k entries) to prevent repeated queries for same user
- Cache invalidation on role/permission changes
- Added database indexes for fast lookups:
  - `user_roles_user_school_idx` (user_id, school_id)
  - `user_roles_role_idx` (role_id)
  - `roles_name_school_unique` (name, school_id)
  - `user_roles_unique_grant` (user_id, role_id, school_id)

### MAINT-001: Complex Permission Logic
**Problem**: The permission checking logic was overly complex with excessive type checking and fallbacks.

**Files Modified**:
- `src/domain/auth/permissions.ts` - New canonical permission system
- `src/domain/auth/roles.ts` - Role definitions with least-privilege defaults
- `src/infrastructure/http/middleware/auth.ts` - Simplified to use new permission system

**Fix Details**:
- Replaced complex permission parsing with strict canonical format
- Created standardized permission strings (`students:read`, `staff:write`, etc.)
- Implemented clear hierarchy: wildcard (`*`) > resource wildcard (`resource:*`) > specific permissions
- Added utility functions: `hasPermission`, `hasAnyPermission`, `hasAllPermissions`
- Eliminated all type checking and fallback logic from auth middleware

## Medium Priority Fixes (P2)

### REL-001: Missing Health Check Endpoints
**Problem**: No health check endpoints for Kubernetes/production orchestration.

**Files Modified**:
- `app/api/health/live/route.ts` - Liveness probe (simple 200 OK)
- `app/api/health/ready/route.ts` - Readiness probe (checks DB connectivity)
- `app/api/health/route.ts` - Index file exporting ready endpoint

**Fix Details**:
- Liveness endpoint: `/api/health/live` - Returns 200 if process is running
- Readiness endpoint: `/api/health/ready` - Returns 200 if DB is connected, 503 otherwise
- Both endpoints set `Cache-Control: no-store` and are `force-dynamic`
- Ready for Kubernetes livenessProbe and readinessProbe configuration

### SEC-004: Missing Security Headers
**Problem**: Missing security headers exposing application to XSS, clickjacking, and other attacks.

**Files Modified**:
- `next.config.ts` - Added comprehensive security headers

**Fix Details**:
- Content Security Policy (CSP): Restricts sources for scripts, styles, images, etc.
- X-Content-Type-Options: nosniff - Prevents MIME sniffing
- X-Frame-Options: DENY - Prevents clickjacking
- Referrer-Policy: strict-origin-when-cross-origin - Controls referrer information
- Permissions-Policy: Restricts access to sensitive APIs (camera, microphone, geolocation)
- Strict-Transport-Security: HSTS for production (max-age=2 years, includeSubDomains, preload)
- poweredByHeader: false - Hides X-Powered-By header

## Additional Improvements

### Testing
- Added comprehensive unit tests for permissions (`tests/permissions.test.ts`)
- Added rate limiting tests (`tests/rate-limit.test.ts`)
- Added auth middleware regression tests (`tests/auth-middleware.test.ts`)

### Documentation
- Added environment variables documentation (`.env.example` additions)
- Added package.json dependencies (lru-cache, zod, optional ioredis)
- Added verification script (`scripts/verify-fixes.ts`)
- Added admin initialization script (`scripts/seed-admin.ts`)
- Added permission cache invalidation script (`scripts/invalidate-permissions.ts`)

## Deployment Instructions

### 1. Environment Setup
Add these variables to your `.env.local`:
```
# SEC-001: Bootstrap admin (run once per school)
BOOTSTRAP_ADMIN_EMAIL=admin@school.example
BOOTSTRAP_ADMIN_SCHOOL_ID=00000000-0000-0000-0000-000000000001

# SEC-003: Rate limiting
RATE_LIMIT_DRIVER=memory        # or "redis" for production
REDIS_URL=redis://localhost:6379
TRUST_PROXY=true               # set true only behind trusted proxy

# PERF-001: Permission cache
PERMISSION_CACHE_TTL_MS=60000
```

### 2. Install Dependencies
```bash
npm install lru-cache zod
npm install -D vitest @types/node
# Optional for production rate limiting/cache:
# npm install ioredis
```

### 3. Apply Database Migration
```bash
npx drizzle-kit migrate
# or if using custom migration:
psql $DATABASE_URL -f drizzle/migrations/0001_roles_permissions_indexes.sql
```

### 4. Initialize Admin Roles (CRITICAL)
```bash
# Run this ONCE per school after deploying the fixes
# Make sure to set the correct email and school ID for your initial admin
npm run seed:admin
# or: npx tsx scripts/seed-admin.ts
```

### 5. Start Application
```bash
npm run dev
```

### 6. Verify Fixes
```bash
npx tsx scripts/verify-fixes.ts
```

## Verification Checklist

After deployment, verify these behaviors:

### SEC-001: Authentication Bypass Fix
- [ ] New user with no roles gets 403 on protected routes
- [ ] Existing user without role in specific school gets 403
- [ ] Admin user gets appropriate access based on assigned role
- [ ] No automatic role creation in database logs

### SEC-002: SQL Injection Fix
- [ ] Malformed permissions in DB cause 500 error, not SQL execution
- [ ] Valid permissions work normally
- [ ] Permission validation rejects JSON strings with SQL injection attempts
- [ ] Oversized permission payloads are rejected

### SEC-003: Rate Limiting Fix
- [ ] Auth endpoints return 429 after exceeding limits
- [ ] Rate limit headers present in responses
- [ ] Different limits apply to different endpoints (sign-in vs sign-up)
- [ ] Per-IP and per-account limits work correctly
- [ ] Failed authentication attempts count toward limits

### PERF-001: N+1 Query Fix
- [ ] Database query log shows single JOIN query for permission resolution
- [ ] Repeated requests for same user use cache (after first request)
- [ ] Permission changes properly invalidate cache
- [ ] Response times improved under load

### MAINT-001: Permission Logic Fix
- [ ] Permission strings follow canonical format (`resource:action`)
- [ ] Wildcard permissions work as expected
- [ ] Resource wildcards (`resource:*`) grant all actions for resource
- [ ] Complex permission objects are no longer accepted

### REL-001: Health Endpoints Fix
- [ ] `/api/health/live` returns 200 when application is running
- [ ] `/api/health/ready` returns 200 when database is connected
- [ ] `/api/health/ready` returns 503 when database is disconnected
- [ ] Both endpoints have proper headers and caching directives

### SEC-004: Security Headers Fix
- [ ] All responses include Content-Security-Policy header
- [ ] All responses include X-Frame-Options: DENY
- [ ] All responses include X-Content-Type-Options: nosniff
- [ ] Production responses include Strict-Transport-Security
- [ ] Security headers score A+ on securityheaders.com

## Rollback Plan

If issues arise after deployment:

1. **Revert code changes**: Git revert the commits containing these fixes
2. **Database**: The migration is additive and safe; indexes can be dropped if needed:
   ```sql
   DROP INDEX IF EXISTS user_roles_user_school_idx;
   DROP INDEX IF EXISTS user_roles_role_idx;
   DROP INDEX IF EXISTS roles_name_school_unique;
   DROP INDEX IF EXISTS user_roles_unique_grant;
   ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_permissions_is_array;
   ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_permissions_elements_are_strings;
   ```
3. **Environment**: Remove the new environment variables if needed
4. **Admin roles**: The seed script is idempotent and safe to re-run

## Testing

Run the test suite:
```bash
npm test
# or
npx vitest run
```

## Performance Impact

- **Positive**: Reduced database load from N+1 queries to single queries + caching
- **Negligible**: Permission validation adds microseconds of CPU time
- **Beneficial**: Rate limiting protects against abuse that would cause performance degradation
- **Memory**: Permission cache uses ~10MB for 10k entries (adjustable via PERMISSION_CACHE_TTL_MS and MAX_ENTRIES)

## Security Impact

- **Eliminated**: Authentication bypass vulnerability (complete fix)
- **Eliminated**: SQL injection risk in permission parsing (complete fix)
- **Mitigated**: Brute force attack surface (rate limiting reduces attack volume)
- **Improved**: Principle of least privilege (no automatic elevation)
- **Enhanced**: Defense in depth (multiple layers of validation and protection)

## Maintenance Impact

- **Reduced**: Simplified permission logic makes code easier to understand and maintain
- **Improved**: Clear separation of concerns (domain, application, infrastructure layers)
- **Standardized**: Canonical permission format reduces ambiguity and bugs
- **Observable**: Health endpoints and rate limiting metrics improve operational visibility