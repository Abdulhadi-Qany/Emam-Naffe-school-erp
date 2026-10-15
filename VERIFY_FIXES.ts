// scripts/verify-fixes.ts
/**
 * Verification script for the security fixes.
 * Run after deploying changes to test the fixes.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

function log(msg: string) {
  console.log(`[VERIFY] ${msg}`);
}

function error(msg: string) {
  console.error(`[VERIFY][ERROR] ${msg}`);
  process.exit(1);
}

function success(msg: string) {
  console.log(`[VERIFY][SUCCESS] ${msg}`);
}

log("Starting verification of security fixes...");

// Check 1: SEC-001 fix - auth middleware should not auto-create roles
log("Checking SEC-001 fix (authentication bypass)...");
const authMiddleware = readFileSync("src/infrastructure/http/middleware/auth.ts", "utf8");
if (authMiddleware.includes("crypto.randomUUID") && authMiddleware.includes("school_admin")) {
  error("SEC-001 not fixed: auth middleware still contains auto-role creation code");
} else {
  success("SEC-001 appears to be fixed: no auto-role creation code found");
}

// Check 2: SEC-002 fix - permission parsing should be strict
log("Checking SEC-002 fix (SQL injection)...");
const permissionsFile = readFileSync("src/domain/auth/permissions.ts", "utf8");
if (!permissionsFile.includes("PermissionParseError") || !permissionsFile.includes("parsePermissions")) {
  error("SEC-002 not fixed: strict permission parsing not found");
} else {
  success("SEC-002 appears to be fixed: strict permission parsing implemented");
}

// Check 3: SEC-003 fix - rate limiting should be present
log("Checking SEC-003 fix (rate limiting)...");
const authRoute = readFileSync("app/api/auth/[...all]/route.ts", "utf8");
if (!authRoute.includes("checkRateLimit") || !authRoute.includes("tooManyResponse")) {
  error("SEC-003 not fixed: rate limiting not found in auth route");
} else {
  success("SEC-003 appears to be fixed: rate limiting implemented");
}

// Check 4: PERF-001 fix - permission service should exist
log("Checking PERF-001 fix (N+1 query)...");
const permissionService = readFileSync("src/application/auth/permission-service.ts", "utf8");
if (!permissionService.includes("resolve") || !permissionService.includes("LRUCache")) {
  error("PERF-001 not fixed: permission service with caching not found");
} else {
  success("PERF-001 appears to be fixed: permission service with caching implemented");
}

// Check 5: Health endpoints should exist
log("Checking REL-001 fix (health endpoints)...");
const healthLive = existsSync("app/api/health/live/route.ts");
const healthReady = existsSync("app/api/health/ready/route.ts");
if (!healthLive || !healthReady) {
  error("REL-001 not fixed: health endpoints missing");
} else {
  success("REL-001 appears to be fixed: health endpoints present");
}

// Check 6: Database migration should exist
log("Checking database migration...");
const migration = existsSync("drizzle/migrations/0001_roles_permissions_indexes.sql");
if (!migration) {
  error("Database migration not found: 0001_roles_permissions_indexes.sql");
} else {
  success("Database migration found");
}

// Check 7: Next.js config should have security headers
log("Checking security headers (SEC-004)...");
const nextConfig = readFileSync("next.config.ts", "utf8");
if (!nextConfig.includes("Content-Security-Policy") || !nextConfig.includes("X-Frame-Options")) {
  error("SEC-004 not fixed: security headers missing from Next.js config");
} else {
  success("SEC-004 appears to be fixed: security headers present");
}

log("All checks passed! Security fixes appear to be implemented correctly.");
log("");
log("Next steps:");
log("1. Run: npm run seed:admin (to initialize admin roles)");
log("2. Run: npm run dev (to start development server)");
log("3. Test the fixes:");
log("   - Try accessing protected routes without roles -> should get 403");
log("   - Try brute force auth -> should get 429 after limit");
log("   - Check health endpoints -> /api/health/live and /api/health/ready");
log("   - Verify security headers with: curl -I http://localhost:3000");