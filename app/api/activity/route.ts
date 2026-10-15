import { db } from '@/lib/db'
import { auditLogs, userProfiles } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, withV1, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/activity?module&action&query&page&limit
 * → the auditable activity timeline (audit_logs joined with user names).
 */
export async function GET(request: NextRequest) {
  return withV1('audit:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const filters = parseFilters(searchParams, ['module', 'action', 'entityType', 'userId'])
    const query = searchParams.get('query')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)
    const offset = (page - 1) * limit

    const conditions = [eq(auditLogs.schoolId, schoolId)]
    if (filters.module) conditions.push(eq(auditLogs.module, filters.module))
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action))
    if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType))
    if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId))
    if (query) {
      const q = `%${query}%`
      conditions.push(sql`(${auditLogs.entityId} ilike ${q} or ${auditLogs.action} ilike ${q} or ${auditLogs.entityType} ilike ${q} or ${auditLogs.module} ilike ${q})`)
    }

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(and(...conditions))

    const rows = await db
      .select({
        entry: auditLogs,
        actor: userProfiles.fullName,
      })
      .from(auditLogs)
      .leftJoin(userProfiles, eq(auditLogs.userId, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset)

    const totalCount = Number(total?.count ?? 0)

    return ok({
      entries: rows.map(({ entry, actor }) => ({
        id: entry.id,
        actor: actor ?? (entry.userId ? 'System' : 'System'),
        action: entry.action,
        target: `${entry.entityType} ${entry.entityId}`,
        module: entry.module,
        detail: entry.changes ? JSON.stringify(entry.changes).slice(0, 240) : null,
        time: formatShortTime(entry.createdAt),
        createdAt: entry.createdAt,
      })),
      total: totalCount,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      modules: await distinctModules(schoolId),
      actions: ['created', 'updated', 'deleted', 'approved', 'published'],
    })
  })(request)
}

async function distinctModules(schoolId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ module: auditLogs.module })
    .from(auditLogs)
    .where(eq(auditLogs.schoolId, schoolId))
  return rows.map((row) => row.module)
}

function formatShortTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${Math.floor(hours / 24)} day(s) ago`
}
