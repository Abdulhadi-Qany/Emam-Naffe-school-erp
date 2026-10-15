import { db } from '@/lib/db'
import { staffRoles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * PUT /api/it-portal/users/[id] { role, permissions }
 * → assigns the role/permissions for a user on the current school.
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('users:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const role = body.role as string | undefined
    const permissions = body.permissions as string[] | undefined
    if (!role) return badRequest('role is required')
    if (!Array.isArray(permissions)) return badRequest('permissions must be an array')

    const [existing] = await db
      .select({ id: staffRoles.id })
      .from(staffRoles)
      .where(and(eq(staffRoles.userId, id), eq(staffRoles.schoolId, schoolId)))
      .limit(1)

    if (existing) {
      const [updated] = (await db
        .update(staffRoles)
        .set({ role, permissions, updatedAt: new Date() })
        .where(eq(staffRoles.id, existing.id))
        .returning()) as unknown as Record<string, unknown>[]
      await audit({ schoolId, userId: user.id, action: 'updated', module: 'settings', entityType: 'staff_role', entityId: id, changes: { role, permissions } })
      return ok(updated)
    }

    const [createdRow] = (await db
      .insert(staffRoles)
      .values({ id: crypto.randomUUID(), schoolId, userId: id, role, permissions })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'settings', entityType: 'staff_role', entityId: id, changes: { role, permissions } })
    return ok(createdRow)
  })(request, context)
}

/** DELETE /api/it-portal/users/[id] → revokes the role for the current school. */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('users:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: staffRoles.id })
      .from(staffRoles)
      .where(and(eq(staffRoles.userId, id), eq(staffRoles.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Role not found')

    await db.delete(staffRoles).where(eq(staffRoles.id, existing.id))

    await audit({ schoolId, userId: user.id, action: 'deleted', module: 'settings', entityType: 'staff_role', entityId: id })
    return ok({ message: 'Role revoked', userId: id })
  })(request, context)
}