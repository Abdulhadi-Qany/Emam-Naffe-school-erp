import { db } from '@/lib/db'
import { feeStructures, grades, sections } from '@/lib/db/schema'
import { and as and2, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('fees:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select()
      .from(feeStructures)
      .where(and2(eq(feeStructures.id, id), eq(feeStructures.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Fee structure not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('fees:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(feeStructures)
      .where(and2(eq(feeStructures.id, id), eq(feeStructures.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Fee structure not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.amount !== undefined && (!Number.isFinite(Number(body.amount)) || Number(body.amount) < 0)) {
      return badRequest('amount must be a non-negative number')
    }
    const gradeId = body.gradeId === undefined ? existing.gradeId : typeof body.gradeId === 'string' ? body.gradeId : body.gradeId === null ? null : undefined
    const sectionId = body.sectionId === undefined ? existing.sectionId : typeof body.sectionId === 'string' ? body.sectionId : body.sectionId === null ? null : undefined
    if (gradeId === undefined) return badRequest('gradeId must be a string or null')
    if (sectionId === undefined) return badRequest('sectionId must be a string or null')
    if (sectionId && !gradeId) return badRequest('gradeId is required when sectionId is provided')
    if (gradeId) {
      const [grade] = await db.select({ id: grades.id }).from(grades)
        .where(and2(eq(grades.id, gradeId), eq(grades.schoolId, schoolId))).limit(1)
      if (!grade) return badRequest('gradeId must belong to the current school')
    }
    if (sectionId) {
      const [section] = await db.select({ id: sections.id }).from(sections)
        .where(and2(eq(sections.id, sectionId), eq(sections.schoolId, schoolId), eq(sections.gradeId, gradeId!))).limit(1)
      if (!section) return badRequest('sectionId must belong to the selected school and grade')
    }
    const dueDate = body.dueDate === undefined ? existing.dueDate : Number(body.dueDate)
    if (!Number.isInteger(dueDate) || dueDate < 1 || dueDate > 31) return badRequest('dueDate must be a day of the month from 1 to 31')
    const lateFeeAmount = body.lateFeeAmount === undefined ? Number(existing.lateFeeAmount) : Number(body.lateFeeAmount)
    if (!Number.isFinite(lateFeeAmount) || lateFeeAmount < 0) return badRequest('lateFeeAmount must be a non-negative number')
    const lateFeeType = body.lateFeeType === undefined ? existing.lateFeeType : body.lateFeeType
    if (lateFeeType !== 'fixed' && lateFeeType !== 'percentage') return badRequest('lateFeeType must be fixed or percentage')
    if (body.frequency !== undefined && (typeof body.frequency !== 'string' || !body.frequency.trim())) return badRequest('frequency must be a non-empty string')
    if (body.feeType !== undefined && (typeof body.feeType !== 'string' || !body.feeType.trim())) return badRequest('feeType must be a non-empty string')
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') return badRequest('isActive must be a boolean')
    if (body.effectiveTo !== undefined && body.effectiveTo !== null && (typeof body.effectiveTo !== 'string' || Number.isNaN(new Date(body.effectiveTo).getTime()))) {
      return badRequest('effectiveTo must be a valid date or null')
    }

    const [updated] = (await db
      .update(feeStructures)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        feeType: typeof body.feeType === 'string' && body.feeType !== '' ? body.feeType : existing.feeType,
        amount: body.amount !== undefined ? Number(body.amount).toFixed(2) : existing.amount,
        frequency: (body.frequency as string) ?? existing.frequency,
        gradeId,
        sectionId,
        dueDate,
        lateFeeAmount: lateFeeAmount.toFixed(2),
        lateFeeType,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        effectiveTo: body.effectiveTo !== undefined ? (body.effectiveTo ? new Date(body.effectiveTo as string) : null) : existing.effectiveTo,
        updatedAt: new Date(),
      })
      .where(eq(feeStructures.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'finance',
      entityType: 'fee_structure',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('fees:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: feeStructures.id })
      .from(feeStructures)
      .where(and2(eq(feeStructures.id, id), eq(feeStructures.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Fee structure not found')

    await db.update(feeStructures).set({ isActive: false, updatedAt: new Date() }).where(eq(feeStructures.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'finance',
      entityType: 'fee_structure',
      entityId: id,
    })

    return deleted('Fee structure archived successfully')
  })(request, context)
}
