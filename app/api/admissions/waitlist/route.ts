import { db } from '@/lib/db'
import { admissionWaitlists } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('admissions:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'gradeId'])
    const query = searchParams.get('query')

    const conditions = [eq(admissionWaitlists.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(admissionWaitlists.status, filters.status))
    if (filters.gradeId) conditions.push(eq(admissionWaitlists.gradeId, filters.gradeId))
    if (query) conditions.push(sql`${admissionWaitlists.applicationId} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(admissionWaitlists).where(and(...conditions))
    const rows = await db.select().from(admissionWaitlists).where(and(...conditions)).orderBy(desc(admissionWaitlists.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('admissions:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['applicationId', 'gradeId']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [createdRow] = (await db
      .insert(admissionWaitlists)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        applicationId: body.applicationId as string,
        gradeId: body.gradeId as string,
        priority: body.priority !== undefined ? Number(body.priority) : 1,
        status: 'queued',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'admissions', entityType: 'admission_waitlist', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}