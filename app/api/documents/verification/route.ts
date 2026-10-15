import { db } from '@/lib/db'
import { documentInstances } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, paged, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/** v1 verification statuses → document_instances enum values. */
const STATUS_MAP: Record<string, 'draft' | 'generated' | 'printed' | 'signed' | 'void'> = {
  pending: 'draft',
  verified: 'signed',
  rejected: 'void',
}

/**
 * Document verification
 * GET  /api/documents/verification?status
 * POST /api/documents/verification { documentId, status, verifiedBy }
 */
export async function GET(request: NextRequest) {
  return withV1('documents:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status'])
    const query = searchParams.get('query')

    const conditions = [eq(documentInstances.schoolId, schoolId)]
    if (filters.status) {
      const mapped = STATUS_MAP[String(filters.status)]
      if (mapped) conditions.push(eq(documentInstances.status, mapped))
    }
    if (query) conditions.push(sql`${documentInstances.title} ilike ${'%' + query + '%'}`)

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(documentInstances).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select()
      .from(documentInstances)
      .where(and(...conditions))
      .orderBy(desc(documentInstances.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('documents:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['documentId', 'status']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }
    const mappedStatus = STATUS_MAP[String(body.status)]
    if (!mappedStatus) {
      return badRequest('status must be verified, rejected, or pending')
    }

    const [existing] = await db.select().from(documentInstances).where(eq(documentInstances.id, body.documentId as string)).limit(1)
    if (!existing) return notFound('Document not found')

    const [updated] = (await db
      .update(documentInstances)
      .set({ status: mappedStatus, verifiedBy: user.id, updatedAt: new Date() })
      .where(eq(documentInstances.id, body.documentId as string))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'updated', module: 'documents', entityType: 'document_verification', entityId: body.documentId as string, changes: { status: body.status } })

    return ok(updated)
  })(request)
}