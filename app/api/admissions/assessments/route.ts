import { db } from '@/lib/db'
import { entranceAssessments, admissionApplications } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('admissions:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['result', 'applicationId'])
    const query = searchParams.get('query')

    const conditions = [eq(entranceAssessments.schoolId, schoolId)]
    if (filters.result) conditions.push(eq(entranceAssessments.result, filters.result))
    if (filters.applicationId) conditions.push(eq(entranceAssessments.applicationId, filters.applicationId))
    if (query) conditions.push(sql`${entranceAssessments.assessmentType} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(entranceAssessments).where(and(...conditions))
    const rows = await db.select().from(entranceAssessments).where(and(...conditions)).orderBy(desc(entranceAssessments.scheduledAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('admissions:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['applicationId', 'assessmentType', 'scheduledAt']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [createdRow] = (await db
      .insert(entranceAssessments)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        applicationId: body.applicationId as string,
        assessmentType: String(body.assessmentType),
        scheduledAt: new Date(body.scheduledAt as string),
        panel: (body.panel as string) ?? null,
        score: body.score !== undefined ? String(body.score) : '0',
        maxScore: body.maxScore !== undefined ? String(body.maxScore) : '100',
        notes: (body.notes as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'admissions',
      entityType: 'entrance_assessment',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}