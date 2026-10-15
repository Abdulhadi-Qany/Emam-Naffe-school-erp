import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { classes, grades, sections, rooms, students } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, badRequest, withV1, audit, created } from '@/lib/api'

/**
 * Classes (grade + section + room, e.g. Grade 8-A).
 * GET  /api/academic/classes?gradeId&sectionId&status&query ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ joined display rows
 * POST /api/academic/classes { name, gradeId, sectionId, capacity?, roomId?, status? }
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
  const { searchParams } = new URL(req.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['gradeId', 'sectionId', 'status', 'roomId'])
  const query = searchParams.get('query')

  const conditions = [eq(classes.schoolId, schoolId)]
  if (filters.gradeId) conditions.push(eq(classes.gradeId, filters.gradeId))
  if (filters.sectionId) conditions.push(eq(classes.sectionId, filters.sectionId))
  if (filters.roomId) conditions.push(eq(classes.roomId, filters.roomId))
  if (filters.status) conditions.push(eq(classes.status, filters.status as never))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`(${classes.name} ilike ${q} or ${grades.name} ilike ${q} or ${sections.name} ilike ${q} or ${rooms.name} ilike ${q})`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(classes)
    .leftJoin(grades, eq(classes.gradeId, grades.id))
    .where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select({
      cls: classes,
      gradeId: grades.id,
      gradeName: grades.name,
      gradeLevel: grades.level,
      sectionId: sections.id,
      sectionName: sections.name,
      roomId: rooms.id,
      roomLabel: rooms.name,
      studentCount: sql<number>`count(distinct ${students.id})::int`,
    })
    .from(classes)
    .leftJoin(grades, eq(classes.gradeId, grades.id))
    .leftJoin(sections, eq(classes.sectionId, sections.id))
    .leftJoin(rooms, eq(classes.roomId, rooms.id))
    .leftJoin(
      students,
      and(
        eq(students.schoolId, classes.schoolId),
        eq(students.currentGradeId, classes.gradeId),
        eq(students.currentSectionId, classes.sectionId),
        sql`${students.status} <> 'deleted'`
      )
    )
    .where(where)
    .groupBy(grades.id, sections.id, rooms.id, classes.id)
    .orderBy(sql`${grades.level} asc nulls last, ${sections.name} asc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(
    rows.map(({ cls, gradeId, gradeName, gradeLevel, sectionId, sectionName, roomId, roomLabel, studentCount }) => ({
      id: cls.id,
      schoolId: cls.schoolId,
      name: cls.name,
      status: cls.status,
      capacity: cls.capacity,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
      gradeId,
      gradeName,
      gradeLevel,
      sectionId,
      sectionName,
      roomId,
      roomLabel,
      studentCount,
    })),
    pagination,
    totalCount
  )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('academics:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const required = ['name', 'gradeId', 'sectionId']
    for (const field of required) {
      if (typeof body[field] !== 'string' || (body[field] as string).trim() === '') {
        return badRequest(`${field} is required`)
      }
    }

      const [grade] = await db.select({ id: grades.id }).from(grades)
        .where(and(eq(grades.id, body.gradeId as string), eq(grades.schoolId, schoolId))).limit(1)
      const [section] = await db.select({ id: sections.id, gradeId: sections.gradeId }).from(sections)
        .where(and(eq(sections.id, body.sectionId as string), eq(sections.schoolId, schoolId))).limit(1)
      if (!grade || !section || section.gradeId !== body.gradeId) {
        return badRequest('gradeId and sectionId must identify a matching grade and section in this school')
      }
      const capacity = body.capacity === undefined ? 40 : Number(body.capacity)
      if (!Number.isInteger(capacity) || capacity < 1) return badRequest('capacity must be a positive integer')

    const [duplicate] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(sql`${classes.schoolId} = ${schoolId} and ${classes.name} = ${(body.name as string).trim()}`)
      .limit(1)
    if (duplicate) return badRequest('A class with this name already exists')

    const [createdRow] = await db
      .insert(classes)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name: (body.name as string).trim(),
        gradeId: body.gradeId as string,
        sectionId: body.sectionId as string,
        capacity,
        roomId: (body.roomId as string) ?? null,
      })
      .returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'class',
      entityId: createdRow.id,
    })

    return created(createdRow)
  })(request)
}
