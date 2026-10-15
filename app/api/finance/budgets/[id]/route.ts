import { db } from '@/lib/db'
import { budgets, academicYears } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit, num, round } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('budgets:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select({
        budget: budgets,
        academicYearName: academicYears.name,
      })
      .from(budgets)
      .leftJoin(academicYears, eq(budgets.academicYearId, academicYears.id))
      .where(and(eq(budgets.id, id), eq(budgets.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Budget not found')
    const allocated = num(row.budget.allocatedAmount)
    const spent = num(row.budget.spentAmount)
    return ok({
      ...row.budget,
      academicYearName: row.academicYearName,
      allocatedValue: allocated,
      spentValue: spent,
      remainingValue: round(allocated - spent),
    })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('budgets:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Budget not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.allocatedAmount !== undefined && num(body.allocatedAmount) < 0) {
      return badRequest('allocatedAmount must be a non-negative number')
    }

    const allocatedValue = body.allocatedAmount !== undefined ? num(body.allocatedAmount) : num(existing.allocatedAmount)
    const spent = num(existing.spentAmount)

    const [updated] = (await db
      .update(budgets)
      .set({
        category: typeof body.category === 'string' && body.category !== '' ? body.category : existing.category,
        academicYearId: body.academicYearId !== undefined ? (body.academicYearId as string | null) : existing.academicYearId,
        allocatedAmount: allocatedValue.toFixed(2),
        remainingAmount: round(Math.max(0, allocatedValue - spent)).toFixed(2),
        notes: body.notes !== undefined ? (body.notes as string | null) : existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'finance',
      entityType: 'budget',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('budgets:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: budgets.id })
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Budget not found')

    await db.delete(budgets).where(eq(budgets.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'finance',
      entityType: 'budget',
      entityId: id,
    })

    return deleted('Budget deleted successfully')
  })(request, context)
}
