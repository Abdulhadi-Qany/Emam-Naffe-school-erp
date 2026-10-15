import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit, num, round } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('expenses:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Expense not found')
    return ok({ ...row, amountValue: num(row.amount) })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('expenses:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Expense not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.amount !== undefined && num(body.amount) <= 0) {
      return badRequest('amount must be greater than zero')
    }

    const [updated] = (await db
      .update(expenses)
      .set({
        category: typeof body.category === 'string' && body.category !== '' ? body.category : existing.category,
        subcategory: body.subcategory !== undefined ? (body.subcategory as string | null) : existing.subcategory,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        amount: body.amount !== undefined ? num(body.amount).toFixed(2) : existing.amount,
        paymentMethod: body.paymentMethod !== undefined ? (body.paymentMethod as never) : existing.paymentMethod,
        vendor: body.vendor !== undefined ? (body.vendor as string | null) : existing.vendor,
        expenseDate: body.expenseDate !== undefined ? new Date(body.expenseDate as string) : existing.expenseDate,
        status: body.status !== undefined ? (body.status as string) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'finance',
      entityType: 'expense',
      entityId: id,
    })

    return ok({ ...updated, amountValue: num(updated.amount as string) })
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('expenses:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: expenses.id })
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Expense not found')

    await db.delete(expenses).where(eq(expenses.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'finance',
      entityType: 'expense',
      entityId: id,
    })

    return deleted('Expense deleted successfully')
  })(request, context)
}
