import { db } from '@/lib/db'
import { studentAttendance } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/attendance/[id]
 * PUT    /api/attendance/[id]  (single-row fix, e.g. marking one student late)
 * DELETE /api/attendance/[id]  (removes the attendance row)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('attendance:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select()
      .from(studentAttendance)
      .where(and(eq(studentAttendance.id, id), eq(studentAttendance.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Attendance record not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('attendance:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(studentAttendance)
      .where(and(eq(studentAttendance.id, id), eq(studentAttendance.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Attendance record not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.status !== undefined && !['present', 'absent', 'late', 'excused', 'holiday'].includes(String(body.status))) {
      return badRequest('status must be present, absent, late, excused or holiday')
    }

    const [updated] = (await db
      .update(studentAttendance)
      .set({
        status: body.status !== undefined ? (body.status as never) : existing.status,
        remarks: body.remarks !== undefined ? (body.remarks as string | null) : existing.remarks,
        recordedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(studentAttendance.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'attendance',
      entityType: 'student_attendance',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('attendance:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: studentAttendance.id })
      .from(studentAttendance)
      .where(and(eq(studentAttendance.id, id), eq(studentAttendance.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Attendance record not found')

    await db.delete(studentAttendance).where(eq(studentAttendance.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'attendance',
      entityType: 'student_attendance',
      entityId: id,
    })

    return deleted('Attendance record deleted successfully')
  })(request, context)
}
