// NEW: src/domain/auth/permissions.ts
// Fixes MAINT-001 (Complex Permission Logic) and SEC-002 (SQL Injection)

/**
 * Canonical permission model.
 * Format: "<resource>:<action>"  or  "<resource>:*"  or  "*"
 * No free-form strings. No ad-hoc JSON. No guessing.
 */

export const PERMISSIONS = {
  // wildcard
  WILDCARD: "*",

  // students
  STUDENTS_READ:  "students:read",
  STUDENTS_WRITE: "students:write",
  STUDENTS_DELETE:"students:delete",

  // staff
  STAFF_READ:  "staff:read",
  STAFF_WRITE: "staff:write",

  // finance
  FINANCE_READ:  "finance:read",
  FINANCE_WRITE: "finance:write",

  // academics
  ACADEMICS_READ:  "academics:read",
  ACADEMICS_WRITE: "academics:write",

  // admin
  ADMIN_READ:   "admin:read",
  ADMIN_WRITE:  "admin:write",
  ADMIN_MANAGE: "admin:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Allowlist used to reject unknown permissions before they touch the DB. */
const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(
  Object.values(PERMISSIONS) as string[],
);

/** resource:action  |  resource:*  |  *  */
const PERMISSION_PATTERN = /^(?:\*|[a-z][a-z0-9_]*:(?:\*|[a-z][a-z0-9_]*))$/;
const MAX_PERMISSION_LEN = 64;
const MAX_PERMISSIONS_PER_ROLE = 256;
const MAX_RAW_JSON_LEN = 4096;

export class PermissionParseError extends Error {
  constructor(message: string, public readonly input?: unknown) {
    super(message);
    this.name = "PermissionParseError";
  }
}

export function isPermissionString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_PERMISSION_LEN &&
    PERMISSION_PATTERN.test(value)
  );
}

export function isKnownPermission(value: unknown): value is Permission {
  return isPermissionString(value) && KNOWN_PERMISSIONS.has(value);
}

/**
 * Parse a permission payload coming from the DB (jsonb, text, array).
 * STRICT: throws on anything unexpected. No silent coercion.
 * This closes SEC-002: nothing is fed to the query layer unvalidated.
 */
export function parsePermissions(raw: unknown): Permission[] {
  if (raw == null) return [];

  let value: unknown = raw;

  if (typeof raw === "string") {
    if (raw.length > MAX_RAW_JSON_LEN) {
      throw new PermissionParseError("permissions payload too large");
    }
    const trimmed = raw.trim();
    if (trimmed === "") return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      throw new PermissionParseError("permissions payload is not valid JSON", raw);
    }
  }

  if (!Array.isArray(value)) {
    throw new PermissionParseError("permissions payload must be an array", value);
  }
  if (value.length > MAX_PERMISSIONS_PER_ROLE) {
    throw new PermissionParseError("too many permissions", value.length);
  }

  const out: Permission[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isKnownPermission(item)) {
      // Truncate the offender so we never log a full hostile payload.
      const preview = typeof item === "string" ? item.slice(0, 32) : typeof item;
      throw new PermissionParseError(`unknown or malformed permission: ${preview}`, item);
    }
    if (!seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

/** Grants check. O(n) over granted set; wildcard-aware. */
export function hasPermission(
  granted: readonly Permission[],
  required: Permission,
): boolean {
  if (granted.length === 0) return false;
  if (granted.includes(PERMISSIONS.WILDCARD as Permission)) return true;
  if (granted.includes(required)) return true;

  // resource:* implies resource:anything
  const idx = required.indexOf(":");
  if (idx > 0) {
    const resourceWildcard = `${required.slice(0, idx)}:*`;
    if (granted.includes(resourceWildcard as Permission)) return true;
  }
  return false;
}

export function hasAnyPermission(
  granted: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return required.some((p) => hasPermission(granted, p));
}

export function hasAllPermissions(
  granted: readonly Permission[],
  required: readonly Permission[],
): boolean {
  return required.every((p) => hasPermission(granted, p));
}