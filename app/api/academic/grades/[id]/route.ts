import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { grades } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'

/**
 * GET    /api/academic/grades/[id]
 * PUT    /api/academic/grades/[id]
 * DELETE /api/academic/grades/[id]  (soft delete via `status = 'deleted'`)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:read', async (_ctx, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db.select().from(grades).where(eq(grades.id, id)).limit(1)
    if (!row) return notFound('Grade not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(grades).where(eq(grades.id, id)).limit(1)
    if (!existing) return notFound('Grade not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const level = body.level !== undefined ? Number(body.level) : existing.level
    if (!Number.isInteger(level) || level < 1 || level > 12) {
      return badRequest('level must be an integer between 1 and 12')
    }

    const [updated] = await db
      .update(grades)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        level,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(grades.id, id))
      .returning()

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'grade',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(grades).where(eq(grades.id, id)).limit(1)
    if (!existing) return notFound('Grade not found')

    await db.update(grades).set({ status: 'deleted', updatedAt: new Date() }).where(eq(grades.id, id))

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'grade',
      entityId: id,
    })

    return deleted('Grade deleted successfully')
  })(request, context)
}
