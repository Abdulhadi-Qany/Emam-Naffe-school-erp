import { db } from '@/lib/db';
import { auditLogs, userSessions, loginHistory } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import type { PaginatedResult, PaginationOptions } from '@/src/shared/domain/shared-kernel';
import { normalizePagination } from '@/src/shared/domain/shared-kernel';

/** Clean read access for audit timeline + sessions. Writes stay in audit()/better-auth. */
export interface AuditReadModel {
  id: string;
  schoolId: string;
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  createdAt: string;
}

export class AuditReadRepository {
  public async timeline(schoolId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditReadModel>> {
    const p = normalizePagination(pagination);
    const [totalRow] = await db.select({ count: count() }).from(auditLogs).where(eq(auditLogs.schoolId, schoolId));
    const total = totalRow?.count ?? 0;
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.schoolId, schoolId))
      .orderBy(desc(auditLogs.createdAt)).limit(p.limit).offset((p.page - 1) * p.limit);
    return {
      data: rows.map((a) => {
        const r = a as Record<string, unknown>;
        return {
          id: String(r.id), schoolId: String(r.schoolId), action: String(r.action ?? ''),
          module: String(r.module ?? ''), entityType: r.entityType ? String(r.entityType) : undefined,
          entityId: r.entityId ? String(r.entityId) : undefined,
          userId: r.userId ? String(r.userId) : undefined,
          createdAt: r.createdAt instanceof Date ? (r.createdAt as Date).toISOString() : new Date().toISOString(),
        };
      }),
      total, page: p.page, limit: p.limit, totalPages: Math.max(1, Math.ceil(total / p.limit)),
    };
  }
}

export class SessionReadRepository {
  public async activeForUser(userId: string) {
    const rows = await db.select().from(userSessions).where(eq(userSessions.userId, userId));
    return rows.map((s) => {
      const r = s as Record<string, unknown>;
      return {
        id: String(r.id), userId: String(r.userId),
        expiresAt: r.expiresAt instanceof Date ? (r.expiresAt as Date).toISOString() : undefined,
      };
    });
  }

  public async loginHistory(userId: string, limit = 20) {
    const rows = await db.select().from(loginHistory).where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.createdAt)).limit(limit);
    return rows.map((h) => {
      const r = h as Record<string, unknown>;
      return {
        id: String(r.id),
        createdAt: r.createdAt instanceof Date ? (r.createdAt as Date).toISOString() : new Date().toISOString(),
      };
    });
  }
}
