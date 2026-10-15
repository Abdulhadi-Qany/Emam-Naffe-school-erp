import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { studentAttendance, students, classes, academicYears } from '@/lib/db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'
import {
  paged,
  created,
  parsePagination,
  parseFilters,
  badRequest,
  withV1,
  audit,
  startOfDay,
  endOfDay,
  isoDate,
} from '@/lib/api'

/**
 * Attendance module.
 *
 * GET  /api/attendance?classId&from&to&status&query
 *      â†’ per-student attendance rows for a class/date range
 * POST /api/attendance { classId, date, entries: [{ studentId, status, remarks? }] }
 *      â†’ upserts the whole class register for one date (single transaction)
 */

const STATUSES = ['present', 'absent', 'late', 'excused', 'holiday'] as const

export async function GET(request: NextRequest) {
  return withV1('attendance:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['classId', 'status', 'studentId', 'gradeId', 'sectionId'])
    const query = searchParams.get('query')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = [eq(studentAttendance.schoolId, schoolId)]
    if (filters.classId) conditions.push(eq(studentAttendance.classId, filters.classId))
    if (filters.studentId) conditions.push(eq(studentAttendance.studentId, filters.studentId))
    if (filters.status) conditions.push(eq(studentAttendance.status, filters.status as never))
    if (from) conditions.push(sql`${studentAttendance.date} >= ${startOfDay(new Date(from))}`)
    if (to) conditions.push(sql`${studentAttendance.date} <= ${endOfDay(new Date(to))}`)
    if (filters.gradeId || filters.sectionId || query) {
      const studentConditions = []
      if (filters.gradeId) studentConditions.push(sql`${students.currentGradeId} = ${filters.gradeId}`)
      if (filters.sectionId) studentConditions.push(sql`${students.currentSectionId} = ${filters.sectionId}`)
      if (query) {
        const q = `%${query}%`
        studentConditions.push(sql`(${students.fullName} ilike ${q} or ${students.admissionNumber} ilike ${q})`)
      }
      conditions.push(sql`${studentAttendance.studentId} in (select ${students.id} from ${students} where ${sql.join(studentConditions, sql` and `)})`)
    }

    const where = and(...conditions)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(studentAttendance).where(where)
    const totalCount = total?.count ?? 0

    const rows = await db
      .select({
        attendance: studentAttendance,
        studentName: students.fullName,
        admissionNumber: students.admissionNumber,
        className: classes.name,
      })
      .from(studentAttendance)
      .leftJoin(students, eq(studentAttendance.studentId, students.id))
      .leftJoin(classes, eq(studentAttendance.classId, classes.id))
      .where(where)
      .orderBy(sql`${studentAttendance.date} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ attendance, studentName, admissionNumber, className }) => ({
        ...attendance,
        dateLabel: isoDate(attendance.date),
        studentName,
        admissionNumber,
        className,
      })),
      pagination,
      totalCount
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('attendance:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const classId = body.classId as string | undefined
    const dateRaw = body.date as string | undefined
    const entries = body.entries as { studentId: string; status: string; remarks?: string }[] | undefined

    if (!classId || !dateRaw || !Array.isArray(entries) || entries.length === 0) {
      return badRequest('classId, date and entries are required')
    }

    const date = startOfDay(new Date(dateRaw))
    if (Number.isNaN(date.getTime())) return badRequest('date must be a valid date')

    for (const entry of entries) {
      if (!entry.studentId) return badRequest('each entry requires studentId')
      if (!STATUSES.includes(entry.status as (typeof STATUSES)[number])) {
        return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
      }
    }
    const studentIds = entries.map((entry) => entry.studentId)
    if (new Set(studentIds).size !== studentIds.length) return badRequest('entries must not contain duplicate students')

    const [cls] = await db
      .select({
        id: classes.id,
        gradeId: classes.gradeId,
        sectionId: classes.sectionId,
      })
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)))
      .limit(1)
    if (!cls) return badRequest('classId does not reference a class in this school')

    const roster = await db
      .select({ id: students.id })
      .from(students)
      .where(and(
        eq(students.schoolId, schoolId),
        eq(students.currentGradeId, cls.gradeId),
        eq(students.currentSectionId, cls.sectionId),
        inArray(students.id, studentIds),
        sql`${students.status} <> 'deleted'`
      ))
    if (roster.length !== studentIds.length) {
      return badRequest('Every attendance student must be enrolled in this class and school')
    }

    const academicYearId = await resolveAcademicYearId(schoolId)

    const results = await db.transaction(async (tx) => {
      const written: unknown[] = []
      for (const entry of entries) {
        const existing = await tx
          .select({ id: studentAttendance.id })
          .from(studentAttendance)
          .where(and(
            eq(studentAttendance.schoolId, schoolId),
            eq(studentAttendance.studentId, entry.studentId),
            eq(studentAttendance.date, date)
          ))
          .limit(1)

        if (existing.length > 0) {
          const [updated] = (await tx
            .update(studentAttendance)
            .set({
              status: entry.status as never,
              remarks: entry.remarks ?? null,
              classId,
              recordedBy: user.id,
              updatedAt: new Date(),
            })
            .where(eq(studentAttendance.id, existing[0].id))
            .returning()) as unknown as Record<string, unknown>[]
          written.push(updated)
        } else {
          const [inserted] = (await tx
            .insert(studentAttendance)
            .values({
              id: crypto.randomUUID(),
              schoolId,
              studentId: entry.studentId,
              classId,
              date,
              status: entry.status as never,
              remarks: entry.remarks ?? null,
              recordedBy: user.id,
            })
            .returning()) as unknown as Record<string, unknown>[]
          written.push(inserted)
        }
      }
      return written
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'attendance',
      entityType: 'student_attendance',
      entityId: classId,
      changes: { date: isoDate(date), count: results.length },
    })

    return created({ attendance: results, date: isoDate(date), count: results.length, academicYearId })
  })(request)
}

async function resolveAcademicYearId(schoolId: string): Promise<string | null> {
  const [year] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isCurrent, true)))
    .limit(1)
  return year?.id ?? null
}
