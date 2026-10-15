import { db } from '@/lib/db'
import { staffAttendance, staff } from '@/lib/db/schema'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['present', 'absent', 'late', 'excused', 'holiday'] as const

function isAttendanceStatus(value: unknown): value is (typeof STATUSES)[number] {
  return typeof value === 'string' && STATUSES.some((status) => status === value)
}

export async function GET(request: NextRequest) {
  return withV1('hr:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'staffId'])
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = [eq(staff.schoolId, schoolId)]
    if (filters.status) {
      if (!isAttendanceStatus(filters.status)) return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
      conditions.push(eq(staffAttendance.status, filters.status))
    }
    if (filters.staffId) conditions.push(eq(staffAttendance.staffId, filters.staffId))
    if (from) conditions.push(sql`${staffAttendance.date} >= ${new Date(from)}`)
    if (to) conditions.push(sql`${staffAttendance.date} <= ${new Date(to)}`)

    const [totalResult] = await db.select({ count: count() }).from(staffAttendance).innerJoin(staff, eq(staffAttendance.staffId, staff.id)).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({ attendance: staffAttendance, staffName: staff.fullName, staffCode: staff.employeeCode })
      .from(staffAttendance)
      .innerJoin(staff, eq(staffAttendance.staffId, staff.id))
      .where(and(...conditions))
      .orderBy(desc(staffAttendance.date))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('hr:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['staffId', 'date', 'status']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    if (!isAttendanceStatus(body.status)) {
      return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
    }

    const date = new Date(body.date as string)
    if (Number.isNaN(date.getTime())) return badRequest('date must be a valid date')

    const [member] = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, String(body.staffId)), eq(staff.schoolId, schoolId))).limit(1)
    if (!member) return notFound('Staff member not found')

    const [existing] = await db
      .select({ id: staffAttendance.id })
      .from(staffAttendance)
      .where(and(eq(staffAttendance.staffId, body.staffId as string), eq(staffAttendance.date, date)))
      .limit(1)
    if (existing) return conflict('Attendance record already exists for this staff member on this date')

    const [createdRow] = (await db
      .insert(staffAttendance)
      .values({
        id: crypto.randomUUID(),
        staffId: String(body.staffId),
        date,
        status: body.status,
        checkIn: body.checkIn ? new Date(body.checkIn as string) : null,
        checkOut: body.checkOut ? new Date(body.checkOut as string) : null,
        remarks: (body.remarks as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'hr', entityType: 'staff_attendance', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}