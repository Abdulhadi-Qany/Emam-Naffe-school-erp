import { db } from '@/lib/db'
import {
  timetableEntries,
  classes,
  subjects,
  staff,
  rooms,
  periods,
  academicYears,
} from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, conflict, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Timetable module.
 *
 * GET  /api/academic/timetable?classId&academicYearId&dayOfWeek  â†’ grid rows
 *      (periods sorted by period number, joined subject/teacher/room labels)
 * POST /api/academic/timetable  â†’ create a single slot (conflict-checked)
 * GET  /api/academic/timetable/conflicts  â†’ teacher/room/class double bookings
 * POST /api/academic/timetable/substitutions â†’ swap the teacher for a slot
 */

const DAYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const dayOfWeek = searchParams.get('dayOfWeek')

    if (!classId) return badRequest('classId is required')
    if (dayOfWeek && !DAYS.includes(dayOfWeek as (typeof DAYS)[number])) {
      return badRequest(`dayOfWeek must be one of: ${DAYS.join(', ')}`)
    }

    const year = await resolveAcademicYear(schoolId, searchParams.get('academicYearId'))

    const conditions = [
      eq(timetableEntries.schoolId, schoolId),
      eq(timetableEntries.classId, classId),
    ]
    if (dayOfWeek) conditions.push(eq(timetableEntries.dayOfWeek, dayOfWeek as never))
    if (year?.id) conditions.push(eq(timetableEntries.academicYearId, year.id))

    const rows = await db
      .select({
        entry: timetableEntries,
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        teacherId: staff.id,
        teacherName: staff.fullName,
        roomId: rooms.id,
        roomLabel: rooms.name,
        periodId: periods.id,
        periodName: periods.name,
        periodNumber: periods.periodNumber,
        startTime: periods.startTime,
        endTime: periods.endTime,
        isBreak: periods.isBreak,
      })
      .from(timetableEntries)
      .leftJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .leftJoin(staff, eq(timetableEntries.teacherId, staff.id))
      .leftJoin(rooms, eq(timetableEntries.roomId, rooms.id))
      .leftJoin(periods, eq(timetableEntries.periodId, periods.id))
      .where(and(...conditions))
      .orderBy(sql`${periods.periodNumber} asc`)

    return ok({
      academicYear: year,
      classId,
      entries: rows.map(({ entry, subjectId, subjectName, subjectCode, teacherId, teacherName, roomId, roomLabel, periodId, periodName, periodNumber, startTime, endTime, isBreak }) => ({
        id: entry.id,
        dayOfWeek: entry.dayOfWeek,
        subjectId,
        subjectName,
        subjectCode,
        teacherId,
        teacherName,
        roomId,
        roomLabel,
        periodId,
        periodName,
        periodNumber,
        startTime,
        endTime,
        isBreak,
      })),
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('academics:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const classId = body.classId as string
    const subjectId = body.subjectId as string
    const teacherId = body.teacherId as string
    const periodId = body.periodId as string
    const dayOfWeek = body.dayOfWeek as string

    for (const [field, value] of Object.entries({ classId, subjectId, teacherId, periodId, dayOfWeek })) {
      if (!value) return badRequest(`${field} is required`)
    }
    if (!DAYS.includes(dayOfWeek as (typeof DAYS)[number])) {
      return badRequest(`dayOfWeek must be one of: ${DAYS.join(', ')}`)
    }

    const year = await resolveAcademicYear(schoolId, (body.academicYearId as string) ?? null)
    if (!year) return badRequest('No academic year available; create/activate one first')

    const conflictResponse = await checkConflicts(schoolId, year.id, { classId, teacherId, periodId, dayOfWeek, roomId: body.roomId as string | undefined })
    if (conflictResponse) return conflictResponse

    const [createdRow] = (await db
      .insert(timetableEntries)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        classId,
        subjectId,
        teacherId,
        roomId: (body.roomId as string) ?? null,
        periodId,
        dayOfWeek: dayOfWeek as never,
        academicYearId: year.id,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'timetable_entry',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}

/** PUT /api/academic/timetable/[id] â€” update or delete handled by [id] route. */
export async function checkConflicts(
  schoolId: string,
  academicYearId: string,
  slot: { classId: string; teacherId: string; periodId: string; dayOfWeek: string; roomId?: string; excludeId?: string }
): Promise<ReturnType<typeof conflict> | null> {
  const baseConditions = [
    eq(timetableEntries.schoolId, schoolId),
    eq(timetableEntries.academicYearId, academicYearId),
    eq(timetableEntries.periodId, slot.periodId),
    eq(timetableEntries.dayOfWeek, slot.dayOfWeek as never),
  ]

  const [classClash] = await db
    .select({ id: timetableEntries.id })
    .from(timetableEntries)
    .where(and(...baseConditions, eq(timetableEntries.classId, slot.classId)))
    .limit(1)
  if (classClash && slot.excludeId !== classClash.id) {
    return conflict('This class already has a lesson in that period', 'TIMETABLE_CONFLICT')
  }

  const [teacherClash] = await db
    .select({ id: timetableEntries.id })
    .from(timetableEntries)
    .where(and(...baseConditions, eq(timetableEntries.teacherId, slot.teacherId)))
    .limit(1)
  if (teacherClash && slot.excludeId !== teacherClash.id) {
    return conflict('This teacher is already teaching in that period', 'TIMETABLE_CONFLICT')
  }

  if (slot.roomId) {
    const [roomClash] = await db
      .select({ id: timetableEntries.id })
      .from(timetableEntries)
      .where(and(...baseConditions, eq(timetableEntries.roomId, slot.roomId)))
      .limit(1)
    if (roomClash && slot.excludeId !== roomClash.id) {
      return conflict('This room is already booked in that period', 'TIMETABLE_CONFLICT')
    }
  }

  return null
}

async function resolveAcademicYear(schoolId: string, requested: string | null) {
  if (requested) {
    const [year] = await db.select().from(academicYears).where(eq(academicYears.id, requested)).limit(1)
    if (year) return year
  }
  const [current] = await db
    .select()
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isCurrent, true)))
    .limit(1)
  if (current) return current
  const [latest] = await db
    .select()
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true)))
    .orderBy(sql`${academicYears.startDate} desc`)
    .limit(1)
  return latest ?? null
}
