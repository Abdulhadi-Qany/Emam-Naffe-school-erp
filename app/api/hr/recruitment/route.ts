import { db } from '@/lib/db'
import { recruitmentApplications, departments } from '@/lib/db/schema'
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'
import { paged, created, badRequest, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const


/**
 * HR recruitment pipeline.
 * GET  /api/hr/recruitment?stage&position&query
 * POST /api/hr/recruitment { position, applicantName, email?, phone?, departmentId? }
 */
export async function GET(request: NextRequest) {
  return withV1('hr:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['stage', 'departmentId', 'position'])
    const query = searchParams.get('query')

    const conditions = [eq(recruitmentApplications.schoolId, schoolId)]
    if (filters.stage) conditions.push(eq(recruitmentApplications.status, filters.stage))
    if (filters.departmentId) conditions.push(eq(recruitmentApplications.departmentId, filters.departmentId))
    if (filters.position) conditions.push(eq(recruitmentApplications.position, filters.position))
    if (query) {
      const q = `%${query}%`
      conditions.push(
        sql`(${recruitmentApplications.applicantName} ilike ${q} or ${recruitmentApplications.position} ilike ${q} or ${recruitmentApplications.email} ilike ${q})`
      )
    }

    const [totalResult] = await db.select({ count: count() }).from(recruitmentApplications).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        application: recruitmentApplications,
        departmentName: departments.name,
      })
      .from(recruitmentApplications)
      .leftJoin(departments, eq(recruitmentApplications.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(desc(recruitmentApplications.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ application, departmentName }) => ({
        ...application,
        departmentName,
        dateLabel: application.createdAt ? application.createdAt.toISOString().slice(0, 10) : null,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('hr:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['position', 'applicantName']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }
    if (body.stage !== undefined && !STAGES.includes(body.stage as (typeof STAGES)[number])) {
      return badRequest(`stage must be one of: ${STAGES.join(', ')}`)
    }

    const [createdRow] = (await db
      .insert(recruitmentApplications)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        position: String(body.position).trim(),
        departmentId: (body.departmentId as string) ?? null,
        applicantName: String(body.applicantName).trim(),
        email: (body.email as string) ?? null,
        phone: (body.phone as string) ?? null,
        resumeUrl: (body.resumeUrl as string) ?? null,
        status: (body.stage as string) ?? 'applied',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'hr',
      entityType: 'recruitment_application',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
