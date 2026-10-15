import { db } from '@/lib/db'
import { leaveTypes, staff, staffLeave } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

type Context = { params: Promise<{ id: string; leaveId: string }> }

export async function GET(request: NextRequest, context: Context) {
  return withV1('hr:read', async ({ schoolId }, _req, ctx: Context) => {
    const { id, leaveId } = await ctx.params
    const [record] = await db
      .select({ leave: staffLeave, leaveTypeName: leaveTypes.name })
      .from(staffLeave)
      .innerJoin(staff, eq(staffLeave.staffId, staff.id))
      .leftJoin(leaveTypes, eq(staffLeave.leaveTypeId, leaveTypes.id))
      .where(and(
        eq(staffLeave.id, leaveId),
        eq(staffLeave.staffId, id),
        eq(staff.schoolId, schoolId),
      ))
      .limit(1)
    if (!record) return notFound('Leave request not found')
    return ok({ ...record.leave, leaveTypeName: record.leaveTypeName })
  })(request, context)
}

export async function PATCH(request: NextRequest, context: Context) {
  return withV1('hr:write', async ({ user, schoolId }, req, ctx: Context) => {
    const { id, leaveId } = await ctx.params
    const [record] = await db
      .select({ leave: staffLeave })
      .from(staffLeave)
      .innerJoin(staff, eq(staffLeave.staffId, staff.id))
      .where(and(
        eq(staffLeave.id, leaveId),
        eq(staffLeave.staffId, id),
        eq(staff.schoolId, schoolId),
      ))
      .limit(1)
    if (!record) return notFound('Leave request not found')
    if (record.leave.status !== 'pending') {
      return unprocessable('Only pending leave requests can be decided', 'INVALID_STATE')
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const status = body?.status
    if (status !== 'approved' && status !== 'rejected' && status !== 'cancelled') {
      return badRequest("status must be 'approved', 'rejected' or 'cancelled'")
    }

    const rejectionReason = status === 'rejected' && typeof body?.rejectionReason === 'string'
      ? body.rejectionReason.trim()
      : null
    if (status === 'rejected' && !rejectionReason) {
      return badRequest('rejectionReason is required when rejecting a leave request')
    }

    const [updated] = await db
      .update(staffLeave)
      .set({
        status,
        approvedBy: status === 'approved' ? user.id : null,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(and(eq(staffLeave.id, leaveId), eq(staffLeave.staffId, id)))
      .returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'hr',
      entityType: 'staff_leave',
      entityId: leaveId,
      changes: { status },
    })
    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: Context) {
  return withV1('hr:write', async ({ schoolId }, _req, ctx: Context) => {
    const { id, leaveId } = await ctx.params
    const [record] = await db
      .select({ leave: staffLeave })
      .from(staffLeave)
      .innerJoin(staff, eq(staffLeave.staffId, staff.id))
      .where(and(
        eq(staffLeave.id, leaveId),
        eq(staffLeave.staffId, id),
        eq(staff.schoolId, schoolId),
      ))
      .limit(1)
    if (!record) return notFound('Leave request not found')
    if (record.leave.status !== 'pending') {
      return unprocessable('Only pending leave requests can be cancelled', 'INVALID_STATE')
    }

    const [cancelled] = await db
      .update(staffLeave)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(staffLeave.id, leaveId), eq(staffLeave.staffId, id)))
      .returning()
    return ok(cancelled)
  })(request, context)
}
