import { db } from '@/lib/db'
import { staffAttendance, staff } from '@/lib/db/schema'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { paged, created, ok, badRequest, notFound, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['present', 'absent', 'late', 'excused', 'holiday'] as const

function isAttendanceStatus(value: unknown): value is (typeof STATUSES)[number] {
  return typeof value === 'string' && STATUSES.some((status) => status === value)
}

export async function GET(request: NextRequest) {
  return withV1('hr:read', async ({ schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status'])
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = [eq(staff.schoolId, schoolId), eq(staffAttendance.staffId, id)]
    if (filters.status) {
      if (!isAttendanceStatus(filters.status)) return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
      conditions.push(eq(staffAttendance.status, filters.status))
    }
    if (from) conditions.push(sql`${staffAttendance.date} >= ${new Date(from)}`)
    if (to) conditions.push(sql`${staffAttendance.date} <= ${new Date(to)}`)

    const [totalResult] = await db.select({ count: count() }).from(staffAttendance).innerJoin(staff, eq(staffAttendance.staffId, staff.id)).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db.select().from(staffAttendance).innerJoin(staff, eq(staffAttendance.staffId, staff.id)).where(and(...conditions)).orderBy(desc(staffAttendance.date)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows.map(({ staff: _staff, ...record }) => record), pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('hr:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [member] = await db.select({ id: staff.id, schoolId: staff.schoolId }).from(staff).where(and(eq(staff.id, id), eq(staff.schoolId, schoolId))).limit(1)
    if (!member) return notFound('Staff member not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const dateRaw = body.date as string | undefined
    const status = body.status as string | undefined
    if (!dateRaw || !status) return badRequest('date and status are required')
    if (!isAttendanceStatus(status)) return badRequest(`status must be one of: ${STATUSES.join(', ')}`)

    const date = new Date(dateRaw)
    if (Number.isNaN(date.getTime())) return badRequest('date must be a valid date')
    date.setHours(9, 0, 0, 0)

    const [existing] = await db.select({ id: staffAttendance.id }).from(staffAttendance).where(and(eq(staffAttendance.staffId, id), eq(staffAttendance.date, date))).limit(1)

    const values = { status, checkIn: body.checkIn ? new Date(body.checkIn as string) : null, checkOut: body.checkOut ? new Date(body.checkOut as string) : null, remarks: (body.remarks as string) ?? null, recordedBy: user.id, updatedAt: new Date() }

    const [row] = (existing
      ? (await db.update(staffAttendance).set(values).where(eq(staffAttendance.id, existing.id)).returning()) as unknown as Record<string, unknown>[]
      : (await db.insert(staffAttendance).values({ id: crypto.randomUUID(), staffId: id, date, ...values }).returning()) as unknown as Record<string, unknown>[])

    await audit({ schoolId: member.schoolId, userId: user.id, action: existing ? 'updated' : 'created', module: 'hr', entityType: 'staff_attendance', entityId: existing?.id ?? String(row.id), changes: { status } })

    return existing ? ok(row) : created(row)
  })(request)
}