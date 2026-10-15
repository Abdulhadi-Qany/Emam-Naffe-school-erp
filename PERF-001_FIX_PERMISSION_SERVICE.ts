// NEW: src/application/auth/permission-service.ts
// Fixes PERF-001 (N+1 Query) with caching and single JOIN query

import { and, eq, inArray, isNull } from "drizzle-orm";
import { LRUCache } from "lru-cache";
import { db } from "@/infrastructure/db/client";
import { roles, userRoles } from "@/infrastructure/db/schema";
import { parsePermissions, type Permission } from "@/domain/auth/permissions";

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

  /** Single round-trip: JOIN user_roles → roles, then validate. Fixes N+1. */
  async resolve(userId: string, schoolId: string | null): Promise<ResolvedAuth> {
    const key = `${userId}::${schoolId ?? "_"}`;
    const hit = this.cache.get(key);
    if (hit) return hit;

    const rows = await db
      .select({
        roleName: roles.name,
        permissions: roles.permissions, // jsonb
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          schoolId ? eq(userRoles.schoolId, schoolId) : isNull(userRoles.schoolId),
        ),
      );

    const roleNames: string[] = [];
    const permissionSet = new Set<Permission>();

    for (const row of rows) {
      roleNames.push(row.roleName);
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

  /** Call after editing a role's permissions or name. */
  async invalidateRole(roleId: string): Promise<void> {
    const affected = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));

    const ids = new Set(affected.map((r) => r.userId));
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