import { db } from '@/lib/db';
import { users, staffRoles, roles } from '@/lib/db/schema';
import { eq, count, sql, and } from 'drizzle-orm';
import type { PaginatedResult, PaginationOptions } from '@/src/shared/domain/shared-kernel';
import { normalizePagination } from '@/src/shared/domain/shared-kernel';

/**
 * Identity READ models — Clean read access for better-auth/RBAC tables.
 * No route touches Drizzle; all reads go container → repository → presenter.
 * (Writes stay in better-auth / RBAC services — never Generic CRUD.)
 */

export interface IdentityUserReadModel {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export class UserReadRepository {
  public async findById(id: string): Promise<IdentityUserReadModel | null> {
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!u) return null;
    const r = u as Record<string, unknown>;
    return {
      id: String(r.id),
      email: String(r.email ?? ''),
      name: r.firstName ? `${r.firstName} ${r.lastName ?? ''}`.trim() : undefined,
      createdAt: r.createdAt instanceof Date ? (r.createdAt as Date).toISOString() : new Date().toISOString(),
    };
  }

  public async list(query?: string, pagination?: PaginationOptions): Promise<PaginatedResult<IdentityUserReadModel>> {
    const p = normalizePagination(pagination);
    const where = query ? sql`email ilike ${'%' + query + '%'}` : undefined;
    const [totalRow] = await db.select({ count: count() }).from(users).where(where as never);
    const total = totalRow?.count ?? 0;
    const rows = await db.select().from(users).where(where as never)
      .orderBy(sql`created_at desc`).limit(p.limit).offset((p.page - 1) * p.limit);
    return {
      data: rows.map((u) => {
        const r = u as Record<string, unknown>;
        return {
          id: String(r.id), email: String(r.email ?? ''),
          name: r.firstName ? `${r.firstName} ${r.lastName ?? ''}`.trim() : undefined,
          createdAt: r.createdAt instanceof Date ? (r.createdAt as Date).toISOString() : new Date().toISOString(),
        };
      }),
      total, page: p.page, limit: p.limit, totalPages: Math.max(1, Math.ceil(total / p.limit)),
    };
  }
}

export interface RoleReadModel {
  id: string;
  schoolId: string;
  role: string;
  permissions: string[];
}

export class RoleReadRepository {
  public async listBySchool(schoolId: string): Promise<RoleReadModel[]> {
    const rows = await db.select().from(staffRoles).where(eq(staffRoles.schoolId, schoolId));
    return rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id), schoolId: String(row.schoolId), role: String(row.role ?? ''),
        permissions: Array.isArray(row.permissions) ? (row.permissions as string[]) : [],
      };
    });
  }

  public async rbacRoles(): Promise<Array<{ id: string; name: string }>> {
    try {
      const rows = await db.select({ id: roles.id, name: roles.name }).from(roles);
      return rows.map((r) => ({ id: String(r.id), name: String(r.name) }));
    } catch {
      return [];
    }
  }
}

export class SequenceReadRepository {
  public async current(key: string, schoolId: string): Promise<number> {
    const { numberSequences } = await import('@/lib/db/schema');
    const [row] = await db.select({ value: numberSequences.value }).from(numberSequences)
      .where(and(eq(numberSequences.key, key), eq(numberSequences.schoolId, schoolId))).limit(1);
    return row?.value ?? 0;
  }
}
