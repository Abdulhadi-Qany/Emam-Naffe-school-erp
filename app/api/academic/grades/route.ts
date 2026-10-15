import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { grades, classes, students } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, deleted, paged, badRequest, notFound, conflict, parsePagination, parseFilters, withV1, audit } from '@/lib/api'

const SORTABLE = ['level', 'name', 'createdAt'] as const

/**
 * Grade levels (1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“12).
 * GET  /api/academic/grades?page&limit&query&status  ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ joins class/student counts
 * POST /api/academic/grades { name, level, description? }
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
  const { searchParams } = new URL(req.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['status'])
  const sortBy = searchParams.get('sortBy') ?? 'level'
  const sortOrder = searchParams.get('sortOrder') ?? 'asc'
  const query = searchParams.get('query')

  const conditions = [eq(grades.schoolId, schoolId)]
  if (filters.status) conditions.push(eq(grades.status, filters.status as never))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`(${grades.name} ilike ${q} or cast(${grades.level} as text) = ${query.trim()})`)
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(grades).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select({
      grade: grades,
      classCount: sql<number>`count(distinct ${classes.id})::int`,
      studentCount: sql<number>`count(distinct ${students.id})::int`,
    })
    .from(grades)
    .leftJoin(
      classes,
      and(eq(classes.gradeId, grades.id), sql`${classes.status} <> 'deleted'`)
    )
    .leftJoin(
      students,
      and(eq(students.currentGradeId, grades.id), sql`${students.status} <> 'deleted'`)
    )
    .where(where)
    .groupBy(grades.id)
    .orderBy(sortBy === 'createdAt'
      ? (sortOrder === 'asc' ? sql`${grades.createdAt} asc` : sql`${grades.createdAt} desc`)
      : sortBy === 'name'
        ? (sortOrder === 'asc' ? sql`${grades.name} asc` : sql`${grades.name} desc`)
        : (sortOrder === 'asc' ? sql`${grades.level} asc` : sql`${grades.level} desc`))
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(rows, pagination, totalCount)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('academics:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.name !== 'string' || body.name.trim() === '') return badRequest('name is required')
    const level = Number(body.level)
    if (!Number.isInteger(level) || level < 1 || level > 12) return badRequest('level must be an integer between 1 and 12')

    const [duplicate] = await db
      .select({ id: grades.id })
      .from(grades)
      .where(and(eq(grades.schoolId, schoolId), eq(grades.name, body.name.trim())))
      .limit(1)
    if (duplicate) return conflict('A grade with this name already exists')

    const [createdGrade] = await db
      .insert(grades)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name: body.name.trim(),
        level,
        description: (body.description as string) ?? null,
      })
      .returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'grade',
      entityId: createdGrade.id,
    })

    return created(createdGrade)
  })(request)
}
