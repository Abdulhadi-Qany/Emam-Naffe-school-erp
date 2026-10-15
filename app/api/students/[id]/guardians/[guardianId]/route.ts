import { db } from '@/lib/db'
import { studentGuardians } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string; guardianId: string }> }) {
  return withV1('students:write', async ({ user }, req, ctx: { params: Promise<{ id: string; guardianId: string }> }) => {
    const { id, guardianId } = await ctx.params

    const [existing] = await db
      .select()
      .from(studentGuardians)
      .where(and(eq(studentGuardians.id, guardianId), eq(studentGuardians.studentId, id)))
      .limit(1)
    if (!existing) return notFound('Guardian not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.isPrimary === true) {
      await db.update(studentGuardians).set({ isPrimary: false }).where(eq(studentGuardians.studentId, id))
    }

    const [updated] = (await db
      .update(studentGuardians)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        relationship: typeof body.relationship === 'string' && body.relationship !== '' ? body.relationship : existing.relationship,
        mobile: body.mobile !== undefined ? (body.mobile as string | null) : existing.mobile,
        phone: body.phone !== undefined ? (body.phone as string | null) : existing.phone,
        email: body.email !== undefined ? (body.email as string | null) : existing.email,
        occupation: body.occupation !== undefined ? (body.occupation as string | null) : existing.occupation,
        isPrimary: body.isPrimary !== undefined ? Boolean(body.isPrimary) : existing.isPrimary,
        updatedAt: new Date(),
      })
      .where(eq(studentGuardians.id, guardianId))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId: existing.studentId,
      userId: user.id,
      action: 'updated',
      module: 'students',
      entityType: 'student_guardian',
      entityId: guardianId,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; guardianId: string }> }) {
  return withV1('students:write', async ({ user }, _req, ctx: { params: Promise<{ id: string; guardianId: string }> }) => {
    const { id, guardianId } = await ctx.params

    const [existing] = await db
      .select({ id: studentGuardians.id })
      .from(studentGuardians)
      .where(and(eq(studentGuardians.id, guardianId), eq(studentGuardians.studentId, id)))
      .limit(1)
    if (!existing) return notFound('Guardian not found')

    await db.delete(studentGuardians).where(eq(studentGuardians.id, guardianId))

    await audit({
      schoolId: id,
      userId: user.id,
      action: 'deleted',
      module: 'students',
      entityType: 'student_guardian',
      entityId: guardianId,
    })

    return deleted('Guardian removed successfully')
  })(request, context)
}
