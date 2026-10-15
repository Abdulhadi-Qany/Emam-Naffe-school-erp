import { db } from '@/lib/db'
import { discounts, students } from '@/lib/db/schema'
import { and, eq, ilike, sql, count } from 'drizzle-orm'
import { paged, created, badRequest, withV1, audit, parsePagination, parseFilters, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Scholarships & discounts.
 * GET  /api/finance/discounts?isActive&studentId&query
 * POST /api/finance/discounts { name, discountType, discountValue, studentId?, applicableFeeTypes? }
 */
export async function GET(request: NextRequest) {
  return withV1('fees:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['isActive', 'studentId', 'discountType'])
    const query = searchParams.get('query')

    const conditions = [eq(discounts.schoolId, schoolId)]
    if (filters.isActive === 'true') conditions.push(eq(discounts.isActive, true))
    if (filters.isActive === 'false') conditions.push(eq(discounts.isActive, false))
    if (filters.studentId) conditions.push(eq(discounts.studentId, filters.studentId))
    if (filters.discountType) conditions.push(eq(discounts.discountType, filters.discountType))
    if (query) conditions.push(ilike(discounts.name, `%${query}%`))

    const [totalResult] = await db
      .select({ count: count() })
      .from(discounts)
      .leftJoin(students, eq(discounts.studentId, students.id))
      .where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        discount: discounts,
        studentName: students.fullName,
      })
      .from(discounts)
      .leftJoin(students, eq(discounts.studentId, students.id))
      .where(and(...conditions))
      .orderBy(sql`${discounts.createdAt} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ discount, studentName }) => ({
        ...discount,
        discountValueNumber: num(discount.discountValue),
        studentName,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('fees:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['name', 'discountType', 'discountValue']) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return badRequest(`${field} is required`)
      }
    }
    if (!['percentage', 'fixed'].includes(String(body.discountType))) {
      return badRequest('discountType must be percentage or fixed')
    }

    const value = num(body.discountValue)
    if (value < 0) return badRequest('discountValue must be non-negative')
    if (body.discountType === 'percentage' && value > 100) {
      return badRequest('percentage discounts must be between 0 and 100')
    }

    const [createdRow] = (await db
      .insert(discounts)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        studentId: (body.studentId as string) ?? null,
        name: String(body.name).trim(),
        discountType: String(body.discountType),
        discountValue: value.toFixed(2),
        applicableFeeTypes: (body.applicableFeeTypes as never[]) ?? [],
        startDate: body.startDate ? new Date(body.startDate as string) : new Date(),
        endDate: body.endDate ? new Date(body.endDate as string) : null,
        isActive: body.isActive !== false,
        notes: (body.notes as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'discount',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
