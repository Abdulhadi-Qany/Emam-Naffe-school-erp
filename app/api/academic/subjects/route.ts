import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { subjects, timetableEntries, staff } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, created, badRequest, withV1, audit } from '@/lib/api'
import { createReferenceRoutes } from '@/lib/api/reference'

/**
 * Subject catalog.
 * GET  /api/academic/subjects?status&query Ã¢â€ â€™ adds weekly periods (from
 *      timetable entries) and the assigned teacher, matching the data the
 *      localized subjects page renders.
 * POST /api/academic/subjects { name, code, description?, creditHours?, isElective? }
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
  const { searchParams } = new URL(req.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['status'])
  const query = searchParams.get('query')

  const conditions = [eq(subjects.schoolId, schoolId)]
  if (filters.status) conditions.push(eq(subjects.status, filters.status as never))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`(${subjects.name} ilike ${q} or ${subjects.code} ilike ${q} or ${subjects.description} ilike ${q})`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(subjects).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select({
      subject: subjects,
        weeklyPeriods: sql<number>`(
          select count(*)::int from ${timetableEntries} te
          where te.subject_id = "subjects"."id"
        )`,
      teacherId: staff.id,
      teacherName: staff.fullName,
    })
    .from(subjects)
    .leftJoin(timetableEntries, eq(timetableEntries.subjectId, subjects.id))
    .leftJoin(staff, eq(timetableEntries.teacherId, staff.id))
    .where(where)
    .orderBy(sql`${subjects.code} asc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  const merged = new Map<string, (typeof rows)[number] & { weeklyPeriods: number }>()
  for (const row of rows) {
    const id = row.subject.id
    const existing = merged.get(id)
    if (!existing || row.weeklyPeriods > (existing.weeklyPeriods ?? 0)) {
      merged.set(id, { ...row, weeklyPeriods: row.weeklyPeriods ?? 0 })
    }
  }

  return paged(
    Array.from(merged.values()).map(({ subject, weeklyPeriods, teacherId, teacherName }) => ({
      id: subject.id,
      schoolId: subject.schoolId,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.creditHours,
      isElective: subject.isElective,
      type: subject.isElective ? 'elective' : 'core',
      status: subject.status,
      weeklyPeriods,
      teacherId: teacherId ?? null,
      teacherName: teacherName ?? null,
    })),
    pagination,
    totalCount
  )
  })(request)
}

const reference = createReferenceRoutes({
  table: subjects,
  module: 'academics',
  label: 'Subject',
  requiredFields: ['name', 'code'],
  uniqueFields: ['code'],
  searchableFields: ['name', 'code'],
  filterFields: ['status'],
  sortableFields: ['name', 'code'],
  softDelete: 'status',
  readPermission: 'academics:read',
  writePermission: 'academics:write',
})

export const POST = reference.POST
