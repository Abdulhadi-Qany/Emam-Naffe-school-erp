// src/application/auth/permission-service.ts
//
// Resolves the effective permission set for a user within a school scope.
//
// Source of truth is the `staff_roles.permissions` jsonb column (the same store
// the v1 lane and the admin seed use). A single indexed query per user+school,
// memoised in an LRU keyed by `${userId}::${schoolId}` — fixes the old N+1.
//
// SEC-001: no runtime role creation. Unknown users resolve to an EMPTY set and
// every guard fails closed.
// SEC-002: every permissions payload goes through the strict domain parser
// (`parsePermissions`), which rejects anything not in the allowlist BEFORE it
// can reach the query/log layer.

import { and, eq } from "drizzle-orm";
import { LRUCache } from "lru-cache";
import { db } from "@/lib/db";
import { staffRoles } from "@/lib/db/schema";
import { parsePermissions, type Permission } from "@/src/domain/auth/permissions";

export interface ResolvedAuth {
  userId: string;
  schoolId: string | null;
  roles: string[];
  permissions: readonly Permission[];
  resolvedAt: number;
}

const TTL_MS = Number(process.env.PERMISSION_CACHE_TTL_MS ?? 60_000);
const MAX_ENTRIES = 10_000;

class PermissionService {
  private cache = new LRUCache<string, ResolvedAuth>({
    max: MAX_ENTRIES,
    ttl: TTL_MS,
    updateAgeOnGet: false,
  });

  /**
   * Single round-trip: read every `staff_roles` row for this user (scoped to the
   * school when provided, across all schools otherwise), union the jsonb
   * permission arrays, and strict-parse them.
   */
  async resolve(userId: string, schoolId: string | null): Promise<ResolvedAuth> {
    const key = `${userId}::${schoolId ?? "_"}`;
    const hit = this.cache.get(key);
    if (hit) return hit;

    const rows = await db
      .select({
        role: staffRoles.role,
        permissions: staffRoles.permissions, // jsonb
      })
      .from(staffRoles)
      .where(
        and(
          eq(staffRoles.userId, userId),
          schoolId ? eq(staffRoles.schoolId, schoolId) : eq(staffRoles.schoolId, schoolId ?? ""),
        ),
      );

    const roleNames: string[] = [];
    const permissionSet = new Set<Permission>();

    for (const row of rows) {
      roleNames.push(row.role);
      // STRICT parse; if a row is corrupt we FAIL CLOSED for this user.
      const parsed = parsePermissions(row.permissions);
      for (const p of parsed) permissionSet.add(p);
    }

    const resolved: ResolvedAuth = {
      userId,
      schoolId,
      roles: roleNames,
      permissions: Object.freeze([...permissionSet]),
      resolvedAt: Date.now(),
    };

    this.cache.set(key, resolved);
    return resolved;
  }

  /** Call after role assignment/removal. */
  invalidateUser(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}::`)) this.cache.delete(key);
    }
  }

  /** Call after editing a role's permissions. Invalidates all users in the school. */
  async invalidateRole(schoolId: string): Promise<void> {
    const affected = await db
      .select({ userId: staffRoles.userId })
      .from(staffRoles)
      .where(eq(staffRoles.schoolId, schoolId));

    const ids = new Set(affected.map((r) => r.userId).filter((id): id is string => !!id));
    for (const userId of ids) this.invalidateUser(userId);
  }

  /** Bulk reset (e.g. on deploy or after migrations). */
  clear(): void {
    this.cache.clear();
  }

  stats() {
    return {
      size: this.cache.size,
      ttlMs: TTL_MS,
    };
  }
}

export const permissionService = new PermissionService();

// ---- Drizzle schema fragments used above (for reference) ----
// roles:      id (uuid pk), name (text unique), permissions (jsonb), createdAt, updatedAt
// user_roles: userId (uuid fk), roleId (uuid fk), schoolId (uuid fk nullable)
//   PRIMARY KEY (userId, roleId, schoolId)