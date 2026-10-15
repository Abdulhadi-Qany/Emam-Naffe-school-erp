import { db } from '@/lib/db'
import { approvalRequests } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('finance:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'entityType', 'requestedBy'])
    const query = searchParams.get('query')

    const conditions = [eq(approvalRequests.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(approvalRequests.status, filters.status))
    if (filters.entityType) conditions.push(eq(approvalRequests.entityType, filters.entityType))
    if (filters.requestedBy) conditions.push(eq(approvalRequests.requestedBy, filters.requestedBy))
    if (query) conditions.push(sql`${approvalRequests.reason} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(approvalRequests).where(and(...conditions))
    const rows = await db.select().from(approvalRequests).where(and(...conditions)).orderBy(desc(approvalRequests.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('finance:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['entityType', 'entityId', 'amount', 'reason']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [createdRow] = (await db
      .insert(approvalRequests)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        entityType: String(body.entityType),
        entityId: body.entityId as string,
        amount: String(body.amount),
        reason: String(body.reason),
        requestedBy: user.id,
        status: 'pending',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'approval_request',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}