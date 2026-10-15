import { db } from '@/lib/db'
import { timetableEntries, classes, periods, academicYears } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/academic/timetable/conflicts?academicYearId
 * â†’ every double booking (class, teacher or room) in the current year.
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)

    const yearId = searchParams.get('academicYearId')
    let academicYearId: string | null = yearId
    if (!academicYearId) {
      const [current] = await db
        .select({ id: academicYears.id })
        .from(academicYears)
        .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isCurrent, true)))
        .limit(1)
      academicYearId = current?.id ?? null
    }

    const conditions = [eq(timetableEntries.schoolId, schoolId)]
    if (academicYearId) conditions.push(eq(timetableEntries.academicYearId, academicYearId))

    // Group by period+day and detect duplicate class / teacher / room assignments.
    const rows = await db
      .select({
        periodId: timetableEntries.periodId,
        periodName: periods.name,
        periodNumber: periods.periodNumber,
        dayOfWeek: timetableEntries.dayOfWeek,
        classId: timetableEntries.classId,
        className: classes.name,
        teacherId: timetableEntries.teacherId,
        roomId: timetableEntries.roomId,
      })
      .from(timetableEntries)
      .leftJoin(periods, eq(timetableEntries.periodId, periods.id))
      .leftJoin(classes, eq(timetableEntries.classId, classes.id))
      .where(and(...conditions))
      .orderBy(sql`${periods.periodNumber} asc, ${timetableEntries.dayOfWeek} asc`)

    type Slot = { periodId: string; periodName: string | null; periodNumber: number | null; dayOfWeek: string; classId: string; className: string | null; teacherId: string | null; roomId: string | null }

    const groups = new Map<string, Slot[]>()
    for (const row of rows) {
      const key = `${row.periodId}-${row.dayOfWeek}`
      const slot: Slot = {
        periodId: row.periodId,
        periodName: row.periodName,
        periodNumber: row.periodNumber,
        dayOfWeek: row.dayOfWeek,
        classId: row.classId,
        className: row.className,
        teacherId: row.teacherId,
        roomId: row.roomId,
      }
      const list = groups.get(key) ?? []
      list.push(slot)
      groups.set(key, list)
    }

    const conflicts: { reason: string; periodId: string; periodName: string | null; dayOfWeek: string; entries: Slot[] }[] = []
    for (const slots of groups.values()) {
      const teachers = new Map<string, number>()
      const classIds = new Map<string, number>()
      const roomIds = new Map<string, number>()
      for (const slot of slots) {
        if (slot.teacherId) teachers.set(slot.teacherId, (teachers.get(slot.teacherId) ?? 0) + 1)
        classIds.set(slot.classId, (classIds.get(slot.classId) ?? 0) + 1)
        if (slot.roomId) roomIds.set(slot.roomId, (roomIds.get(slot.roomId) ?? 0) + 1)
      }
      for (const [teacherId, count] of teachers) {
        if (count > 1) conflicts.push({ reason: 'teacher_double_booked', periodId: slots[0].periodId, periodName: slots[0].periodName, dayOfWeek: slots[0].dayOfWeek, entries: slots.filter((s) => s.teacherId === teacherId) })
      }
      for (const [classId, count] of classIds) {
        if (count > 1) conflicts.push({ reason: 'class_double_booked', periodId: slots[0].periodId, periodName: slots[0].periodName, dayOfWeek: slots[0].dayOfWeek, entries: slots.filter((s) => s.classId === classId) })
      }
      for (const [roomId, count] of roomIds) {
        if (count > 1) conflicts.push({ reason: 'room_double_booked', periodId: slots[0].periodId, periodName: slots[0].periodName, dayOfWeek: slots[0].dayOfWeek, entries: slots.filter((s) => s.roomId === roomId) })
      }
    }

    return ok({ academicYearId: academicYearId ?? null, conflicts })
  })(request)
}
