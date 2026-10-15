import { db } from '@/lib/db'
import { exams, academicYears, terms, examSchedules, examMarks } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, withV1, audit, parsePagination, parseFilters, parseSort } from '@/lib/api'
import type { NextRequest } from 'next/server'

const SORTABLE = ['name', 'startDate', 'status', 'createdAt'] as const

/**
 * Examinations.
 * GET  /api/exams?status&termId&academicYearId&query  → joins terms/years + counts
 * POST /api/exams { name, examType, startDate, endDate, academicYearId?, termId?, totalMarks?, passMarks? }
 */
export async function GET(request: NextRequest) {
  return withV1('exams:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'termId', 'academicYearId', 'examType'])
    const { sortBy, sortOrder } = parseSort(searchParams, SORTABLE, 'startDate')
    const query = searchParams.get('query')

    const conditions = [eq(exams.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(exams.status, filters.status as never))
    if (filters.termId) conditions.push(eq(exams.termId, filters.termId))
    if (filters.academicYearId) conditions.push(eq(exams.academicYearId, filters.academicYearId))
    if (filters.examType) conditions.push(eq(exams.examType, filters.examType))
    if (query) {
      const q = `%${query}%`
      conditions.push(sql`(${exams.name} ilike ${q} or ${exams.examType} ilike ${q} or ${exams.description} ilike ${q})`)
    }

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(exams).where(and(...conditions))
    const totalCount = total?.count ?? 0

    const sortColumn = { name: exams.name, startDate: exams.startDate, status: exams.status, createdAt: exams.createdAt }[sortBy]

    const rows = await db
      .select({
        exam: exams,
        academicYearName: academicYears.name,
        termName: terms.name,
        scheduleCount: sql<number>`(
          select count(*)::int from ${examSchedules} es where es.exam_id = "exams"."id"
        )`,
        marksEntered: sql<number>`(
          select count(*)::int from ${examMarks} em
          join ${examSchedules} es2 on es2.id = em.exam_schedule_id
          where es2.exam_id = "exams"."id"
        )`,
      })
      .from(exams)
      .leftJoin(academicYears, eq(exams.academicYearId, academicYears.id))
      .leftJoin(terms, eq(exams.termId, terms.id))
      .where(and(...conditions))
      .orderBy(sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ exam, academicYearName, termName, scheduleCount, marksEntered }) => ({
        ...exam,
        academicYearName,
        termName,
        scheduleCount: scheduleCount ?? 0,
        marksEntered: marksEntered ?? 0,
      })),
      pagination,
      totalCount
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('exams:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['name', 'examType', 'startDate', 'endDate']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const startDate = new Date(body.startDate as string)
    const endDate = new Date(body.endDate as string)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return badRequest('startDate and endDate must be valid dates')
    }
    if (endDate < startDate) return badRequest('endDate must be on or after startDate')

    const [duplicate] = await db
      .select({ id: exams.id })
      .from(exams)
      .where(sql`${exams.schoolId} = ${schoolId} and ${exams.name} = ${String(body.name).trim()} and ${exams.termId} = ${(body.termId as string) ?? null}`)
      .limit(1)
    if (duplicate) return badRequest('An exam with this name already exists for the term')

    const [createdExam] = (await db
      .insert(exams)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name: String(body.name).trim(),
        examType: String(body.examType),
        academicYearId: (body.academicYearId as string) ?? null,
        termId: (body.termId as string) ?? null,
        startDate,
        endDate,
        totalMarks: body.totalMarks !== undefined ? String(body.totalMarks) : '100',
        passMarks: body.passMarks !== undefined ? String(body.passMarks) : '40',
        description: (body.description as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'exam',
      entityId: createdExam.id as string,
    })

    return created(createdExam)
  })(request)
}
