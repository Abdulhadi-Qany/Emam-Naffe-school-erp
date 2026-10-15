import { db } from '@/lib/db'
import { sections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/academic/sections/[id]
 * PUT    /api/academic/sections/[id]
 * DELETE /api/academic/sections/[id]  (soft delete via `status = 'deleted'`)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:read', async (_ctx, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db.select().from(sections).where(eq(sections.id, id)).limit(1)
    if (!row) return notFound('Section not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(sections).where(eq(sections.id, id)).limit(1)
    if (!existing) return notFound('Section not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = await db
      .update(sections)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        gradeId: typeof body.gradeId === 'string' && body.gradeId !== '' ? body.gradeId : existing.gradeId,
        capacity: body.capacity !== undefined ? Number(body.capacity) : existing.capacity,
        classTeacherId: body.classTeacherId !== undefined ? (body.classTeacherId as string | null) : existing.classTeacherId,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(sections.id, id))
      .returning()

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'section',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(sections).where(eq(sections.id, id)).limit(1)
    if (!existing) return notFound('Section not found')

    await db.update(sections).set({ status: 'deleted', updatedAt: new Date() }).where(eq(sections.id, id))

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'section',
      entityId: id,
    })

    return deleted('Section deleted successfully')
  })(request, context)
}
