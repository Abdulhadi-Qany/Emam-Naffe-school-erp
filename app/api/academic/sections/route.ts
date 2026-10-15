import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sections, grades, staff, classes, students } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, withV1 } from '@/lib/api'
import { createReferenceRoutes } from '@/lib/api/reference'

/**
 * Sections (classes within a grade, e.g. 8-A).
 * GET  /api/academic/sections?gradeId&status&query  ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ joins grade info + counts
 * POST /api/academic/sections { name, gradeId, capacity?, classTeacherId? }
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
  const { searchParams } = new URL(req.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['gradeId', 'status'])
  const query = searchParams.get('query')

  const conditions = [eq(sections.schoolId, schoolId)]
  if (filters.gradeId) conditions.push(eq(sections.gradeId, filters.gradeId))
  if (filters.status) conditions.push(eq(sections.status, filters.status as never))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`(${sections.name} ilike ${q} or ${grades.name} ilike ${q})`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(sections).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select({
      section: sections,
      gradeName: grades.name,
      gradeLevel: grades.level,
      classCount: sql<number>`count(distinct ${classes.id})::int`,
      studentCount: sql<number>`count(distinct ${students.id})::int`,
      teacherName: staff.fullName,
    })
    .from(sections)
    .leftJoin(grades, eq(sections.gradeId, grades.id))
    .leftJoin(staff, eq(sections.classTeacherId, staff.id))
    .leftJoin(
      classes,
      and(eq(classes.sectionId, sections.id), sql`${classes.status} <> 'deleted'`)
    )
    .leftJoin(
      students,
      and(
        eq(students.currentSectionId, sections.id),
        eq(students.currentGradeId, sections.gradeId),
        sql`${students.status} <> 'deleted'`
      )
    )
    .where(where)
    .groupBy(grades.id, staff.id, sections.id)
    .orderBy(sql`${grades.level} asc nulls last, ${sections.name} asc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(
    rows.map(({ section, gradeName, gradeLevel, classCount, teacherName }) => ({
      ...section,
      gradeName,
      gradeLevel,
      classCount,
      classTeacherName: teacherName,
    })),
    pagination,
    totalCount
  )
  })(request)
}

const reference = createReferenceRoutes({
  table: sections,
  module: 'academics',
  label: 'Section',
  requiredFields: ['name', 'gradeId'],
  uniqueFields: ['name', 'gradeId'],
  searchableFields: ['name'],
  filterFields: ['gradeId', 'status'],
  sortableFields: ['name'],
  softDelete: 'status',
  readPermission: 'academics:read',
  writePermission: 'academics:write',
})

export const POST = reference.POST
