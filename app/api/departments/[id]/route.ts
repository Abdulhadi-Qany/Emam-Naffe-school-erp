import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { departments } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, conflict, withV1, audit } from '@/lib/api'

/**
 * GET    /api/departments/[id]
 * PUT    /api/departments/[id]
 * DELETE /api/departments/[id]  (deactivates; staff keep their departmentId)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('staff:read', async (_ctx, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db.select().from(departments).where(eq(departments.id, id)).limit(1)
    if (!row) return notFound('Department not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('staff:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(departments).where(eq(departments.id, id)).limit(1)
    if (!existing) return notFound('Department not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (typeof body.name === 'string' && body.name.trim() !== '' && body.name.trim() !== existing.name) {
      const [duplicate] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(and(eq(departments.schoolId, schoolId), eq(departments.name, body.name.trim())))
        .limit(1)
      if (duplicate) return conflict('A department with this name already exists')
    }

    const [updated] = await db
      .update(departments)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        nameDari: body.nameDari !== undefined ? (body.nameDari as string | null) : existing.nameDari,
        namePashto: body.namePashto !== undefined ? (body.namePashto as string | null) : existing.namePashto,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        headId: body.headId !== undefined ? (body.headId as string | null) : existing.headId,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id))
      .returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'staff',
      entityType: 'department',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('staff:write', async ({ user }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(departments).where(eq(departments.id, id)).limit(1)
    if (!existing) return notFound('Department not found')

    await db.update(departments).set({ isActive: false, updatedAt: new Date() }).where(eq(departments.id, id))

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'staff',
      entityType: 'department',
      entityId: id,
    })

    return deleted('Department deactivated successfully')
  })(request, context)
}
