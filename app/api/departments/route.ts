import { db } from '@/lib/db'
import { departments, staff } from '@/lib/db/schema'
import { and, count, eq, ilike, sql } from 'drizzle-orm'
import { created, paged, badRequest, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

const SORTABLE = ['name', 'createdAt'] as const

/**
 * Departments (referenced by staff).
 * GET  /api/departments?page&limit&query&isActive â†’ school-scoped list
 * POST /api/departments { name, nameDari?, namePashto?, description?, headId? }
 */
export async function GET(request: NextRequest) {
  return withV1('staff:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['isActive', 'headId'])
    const query = searchParams.get('query')
    const sortBy = searchParams.get('sortBy') ?? 'name'
    const sortOrder = searchParams.get('sortOrder') ?? 'asc'

    const conditions = [eq(departments.schoolId, schoolId)]
    if (filters.isActive === 'true') conditions.push(eq(departments.isActive, true))
    if (filters.isActive === 'false') conditions.push(eq(departments.isActive, false))
    if (filters.headId) conditions.push(eq(departments.headId, filters.headId))
    if (query) conditions.push(ilike(departments.name, `%${query}%`))

    const where = and(...conditions)

    const [totalResult] = await db.select({ count: count() }).from(departments).where(where)
    const total = totalResult?.count ?? 0

    const sortColumn = sortBy === 'createdAt' ? departments.createdAt : departments.name
    const rows = await db
      .select({
        id: departments.id,
        schoolId: departments.schoolId,
        name: departments.name,
        nameDari: departments.nameDari,
        namePashto: departments.namePashto,
        description: departments.description,
        isActive: departments.isActive,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
        headName: staff.fullName,
      })
      .from(departments)
      .leftJoin(staff, eq(departments.headId, staff.id))
      .where(where)
      .orderBy(sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('staff:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.name !== 'string' || body.name.trim() === '') {
      return badRequest('name is required')
    }

    const duplicate = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.schoolId, schoolId), eq(departments.name, body.name.trim())))
      .limit(1)
    if (duplicate.length > 0) return conflict('A department with this name already exists')

    const [createdRow] = (await db
      .insert(departments)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name: body.name.trim(),
        nameDari: (body.nameDari as string) ?? null,
        namePashto: (body.namePashto as string) ?? null,
        description: (body.description as string) ?? null,
        headId: (body.headId as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'staff',
      entityType: 'department',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
