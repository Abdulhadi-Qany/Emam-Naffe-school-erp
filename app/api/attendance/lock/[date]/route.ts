import { db } from '@/lib/db'
import { studentAttendance } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, badRequest, withV1, audit, startOfDay, endOfDay } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest, context: { params: Promise<{ date: string }> }) {
  return withV1('attendance:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ date: string }> }) => {
    const { date: dateParam } = await ctx.params
    const date = startOfDay(new Date(dateParam))
    if (Number.isNaN(date.getTime())) return badRequest('date must be a valid date')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const locked = body?.locked === true

    const rows = await db
      .update(studentAttendance)
      .set({
        remarks: sql`case
          when ${locked} then concat('[LOCKED] ', coalesce(regexp_replace(${studentAttendance.remarks}, '^\[LOCKED\]\s*', ''), ''))
          else regexp_replace(${studentAttendance.remarks}, '^\[LOCKED\]\s*', '')
        end`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(studentAttendance.schoolId, schoolId),
        sql`${studentAttendance.date} >= ${date}`,
        sql`${studentAttendance.date} <= ${endOfDay(date)}`
      ))
      .returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'attendance',
      entityType: 'student_attendance_lock',
      entityId: dateParam,
      changes: { locked, rows: (rows as unknown[]).length },
    })

    return ok({ date: dateParam, locked, recordsAffected: (rows as unknown[]).length })
  })(request)
}

