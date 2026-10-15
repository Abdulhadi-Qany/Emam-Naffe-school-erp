import { db } from '@/lib/db'
import { budgets, academicYears, expenses } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, ok, badRequest, conflict, withV1, audit, parsePagination, num, round } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Budgets (per category per academic year).
 * GET  /api/finance/budgets?academicYearId&query  → allocated/spent/remaining + variance
 * POST /api/finance/budgets { category, allocatedAmount, academicYearId? }
 */
export async function GET(request: NextRequest) {
  return withV1('budgets:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const academicYearId = searchParams.get('academicYearId')
    const query = searchParams.get('query')

    const conditions = [eq(budgets.schoolId, schoolId)]
    if (academicYearId) conditions.push(eq(budgets.academicYearId, academicYearId))
    if (query) conditions.push(sql`${budgets.category} ilike ${`%${query}%`}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(budgets).where(and(...conditions))
    const totalCount = total?.count ?? 0

    const rows = await db
      .select({
        budget: budgets,
        academicYearName: academicYears.name,
        actualSpent: sql<number>`(
          select coalesce(sum(${expenses.amount}), 0) from ${expenses}
          where ${expenses.schoolId} = ${budgets.schoolId}
            and ${expenses.category} = ${budgets.category}
            and ${expenses.status} = 'approved'
        )`,
      })
      .from(budgets)
      .leftJoin(academicYears, eq(budgets.academicYearId, academicYears.id))
      .where(and(...conditions))
      .orderBy(sql`${budgets.category} asc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ budget, academicYearName, actualSpent }) => {
        const allocated = num(budget.allocatedAmount)
        const spent = round(num(actualSpent ?? 0))
        return {
          ...budget,
          allocatedValue: allocated,
          spentValue: spent,
          remainingValue: round(allocated - spent),
          variance: allocated > 0 ? round(((spent - allocated) / allocated) * 100) : 0,
          academicYearName,
        }
      }),
      pagination,
      totalCount
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('budgets:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['category', 'allocatedAmount']) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return badRequest(`${field} is required`)
      }
    }

    const allocatedValue = num(body.allocatedAmount)
    if (allocatedValue < 0) return badRequest('allocatedAmount must be a non-negative number')

    const academicYearId = (body.academicYearId as string) ?? null
    const [duplicate] = await db
      .select({ id: budgets.id })
      .from(budgets)
      .where(sql`${budgets.schoolId} = ${schoolId} and ${budgets.category} = ${String(body.category)} and ${budgets.academicYearId} = ${academicYearId}`)
      .limit(1)
    if (duplicate) return conflict('A budget for this category and academic year already exists')

    const [createdRow] = (await db
      .insert(budgets)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        category: String(body.category),
        subcategory: (body.subcategory as string) ?? null,
        academicYearId,
        allocatedAmount: allocatedValue.toFixed(2),
        spentAmount: '0',
        remainingAmount: allocatedValue.toFixed(2),
        notes: (body.notes as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'budget',
      entityId: createdRow.id as string,
      changes: { allocatedAmount: allocatedValue, category: body.category },
    })

    return created(createdRow)
  })(request)
}
