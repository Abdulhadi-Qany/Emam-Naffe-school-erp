import { db } from '@/lib/db'
import { academicYears } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/academic/years/[id]
 * PUT    /api/academic/years/[id]
 * DELETE /api/academic/years/[id]  (archives: `isActive = false`)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:read', async (_ctx, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db.select().from(academicYears).where(eq(academicYears.id, id)).limit(1)
    if (!row) return notFound('Academic year not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(academicYears).where(eq(academicYears.id, id)).limit(1)
    if (!existing) return notFound('Academic year not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.isCurrent === true && !existing.isCurrent) {
      await db.update(academicYears).set({ isCurrent: false, updatedAt: new Date() }).where(eq(academicYears.isCurrent, true))
    }

    const [updated] = await db
      .update(academicYears)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        startDate: body.startDate !== undefined ? new Date(body.startDate as string) : existing.startDate,
        endDate: body.endDate !== undefined ? new Date(body.endDate as string) : existing.endDate,
        isCurrent: body.isCurrent !== undefined ? Boolean(body.isCurrent) : existing.isCurrent,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(academicYears.id, id))
      .returning()

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'academic_year',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(academicYears).where(eq(academicYears.id, id)).limit(1)
    if (!existing) return notFound('Academic year not found')

    await db.update(academicYears).set({ isActive: false, updatedAt: new Date() }).where(eq(academicYears.id, id))

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'academic_year',
      entityId: id,
    })

    return deleted('Academic year archived successfully')
  })(request, context)
}
