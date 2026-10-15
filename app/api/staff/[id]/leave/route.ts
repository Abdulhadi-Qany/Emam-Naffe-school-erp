import { db } from '@/lib/db'
import { staffLeave, leaveTypes, staff } from '@/lib/db/schema'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Staff leave requests.
 * GET  /api/staff/[id]/leave?status&year
 * POST /api/staff/[id]/leave { leaveTypeId, startDate, endDate, reason }
 * PATCH /api/staff/[id]/leave/[leaveId] { status }  â†’ approve / reject
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('hr:read', async (_ctx, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'leaveTypeId'])

    const conditions = [eq(staffLeave.staffId, id)]
    if (filters.status) conditions.push(eq(staffLeave.status, filters.status as never))
    if (filters.leaveTypeId) conditions.push(eq(staffLeave.leaveTypeId, filters.leaveTypeId))

    const [totalResult] = await db.select({ count: count() }).from(staffLeave).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        leave: staffLeave,
        leaveTypeName: leaveTypes.name,
      })
      .from(staffLeave)
      .leftJoin(leaveTypes, eq(staffLeave.leaveTypeId, leaveTypes.id))
      .where(and(...conditions))
      .orderBy(desc(staffLeave.startDate))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ leave, leaveTypeName }) => ({
        ...leave,
        leaveTypeName,
        startDateLabel: leave.startDate ? leave.startDate.toISOString().slice(0, 10) : null,
        endDateLabel: leave.endDate ? leave.endDate.toISOString().slice(0, 10) : null,
        days: leave.startDate && leave.endDate
          ? Math.max(1, Math.round((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / 86_400_000) + 1)
          : null,
      })),
      pagination,
      total
    )
  })(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('hr:write', async ({ user }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [member] = await db.select({ id: staff.id, schoolId: staff.schoolId }).from(staff).where(eq(staff.id, id)).limit(1)
    if (!member) return notFound('Staff member not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['leaveTypeId', 'startDate', 'endDate']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const startDate = new Date(body.startDate as string)
    const endDate = new Date(body.endDate as string)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return badRequest('startDate and endDate must be valid dates')
    }
    if (endDate < startDate) return badRequest('endDate must be on or after startDate')

    const [overlap] = await db
      .select({ id: staffLeave.id })
      .from(staffLeave)
      .where(
        and(
          eq(staffLeave.staffId, id),
          sql`${staffLeave.status} in ('pending', 'approved')`,
          sql`${staffLeave.startDate} <= ${endDate}`,
          sql`${staffLeave.endDate} >= ${startDate}`
        )
      )
      .limit(1)
    if (overlap) return badRequest('An overlapping leave request exists', 'OVERLAPPING_LEAVE')

    const [createdRow] = (await db
      .insert(staffLeave)
      .values({
        id: crypto.randomUUID(),
        staffId: id,
        leaveTypeId: String(body.leaveTypeId),
        startDate,
        endDate,
        reason: (body.reason as string) ?? null,
        status: 'pending',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId: member.schoolId,
      userId: user.id,
      action: 'created',
      module: 'hr',
      entityType: 'staff_leave',
      entityId: createdRow.id as string,
      changes: { staffId: id },
    })

    return created(createdRow)
  })(request)
}
