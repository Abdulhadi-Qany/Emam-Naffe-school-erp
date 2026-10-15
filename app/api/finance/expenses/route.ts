import { db } from '@/lib/db'
import { expenses, users } from '@/lib/db/schema'
import { and, desc, eq, or, ilike, sql, count } from 'drizzle-orm'
import {
  paged,
  created,
  ok,
  badRequest,
  notFound,
  withV1,
  audit,
  parsePagination,
  parseFilters,
  num,
  money,
  prefixedNumber,
} from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Expenses.
 * GET  /api/finance/expenses?category&status&query
 * POST /api/finance/expenses { category, amount, description?, vendor?, expenseDate?, status? }
 */
export async function GET(request: NextRequest) {
  return withV1('expenses:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['category', 'status'])
    const query = searchParams.get('query')

    const conditions = [eq(expenses.schoolId, schoolId)]
    if (filters.category) conditions.push(eq(expenses.category, filters.category))
    if (filters.status) conditions.push(eq(expenses.status, filters.status))
    if (query) {
      const q = `%${query}%`
      conditions.push(
        or(
          ilike(expenses.expenseNumber, q),
          ilike(expenses.description, q),
          ilike(expenses.vendor, q),
          ilike(expenses.category, q)
        )!
      )
    }

    const [totalResult] = await db.select({ count: count() }).from(expenses).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        expense: expenses,
        enteredByName: sql<string | null>`(
          select ${users.id} from ${users} where ${users.id} = ${expenses.enteredBy}
        )`,
      })
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ expense, enteredByName }) => ({
        ...expense,
        amountValue: num(expense.amount),
        dateLabel: expense.expenseDate ? expense.expenseDate.toISOString().slice(0, 10) : null,
        enteredByName,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('expenses:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['category', 'amount']) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return badRequest(`${field} is required`)
      }
    }

    const amountValue = num(body.amount)
    if (amountValue <= 0) return badRequest('amount must be greater than zero')

    const expenseDate = body.expenseDate ? new Date(body.expenseDate as string) : new Date()
    if (Number.isNaN(expenseDate.getTime())) return badRequest('expenseDate must be a valid date')

    const expenseNumberValue = await prefixedNumber('EBPS-EXP', schoolId)

    const [createdRow] = (await db
      .insert(expenses)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        expenseNumber: expenseNumberValue,
        category: String(body.category),
        subcategory: (body.subcategory as string) ?? null,
        description: (body.description as string) ?? null,
        amount: money(amountValue),
        paymentMethod: (body.paymentMethod as never) ?? 'cash',
        vendor: (body.vendor as string) ?? null,
        invoiceNumber: (body.invoiceNumber as string) ?? null,
        expenseDate,
        approvedBy: body.approvedBy === 'self' ? user.id : ((body.approvedBy as string) ?? null),
        enteredBy: user.id,
        status: (body.status as string) ?? 'approved',
        attachments: (body.attachments as never[]) ?? [],
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'expense',
      entityId: createdRow.id as string,
      changes: { amount: amountValue, category: body.category },
    })

    return created(createdRow)
  })(request)
}
