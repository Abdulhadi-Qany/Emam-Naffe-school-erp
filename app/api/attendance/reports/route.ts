import { db } from '@/lib/db'
import { studentAttendance, students, classes, grades, sections } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, badRequest, withV1, isoDate, startOfDay, endOfDay, parseDateRange } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/attendance/reports?from&to&classId
 * → daily rows per class with present/late/absent/total, plus the summary
 *    totals and per-class rollups the attendance reports page renders.
 */
export async function GET(request: NextRequest) {
  return withV1('attendance:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const { from, to } = parseDateRange(searchParams, 30)
    const classId = searchParams.get('classId')

    const conditions = [
      eq(studentAttendance.schoolId, schoolId),
      sql`${studentAttendance.date} >= ${from}`,
      sql`${studentAttendance.date} <= ${to}`,
    ]
    if (classId) conditions.push(eq(studentAttendance.classId, classId))

    const where = and(...conditions)

    const daily = await db
      .select({
        date: sql<string>`date_trunc('day', ${studentAttendance.date})`.as('day'),
        classId: studentAttendance.classId,
        className: classes.name,
        gradeLevel: grades.level,
        sectionName: sections.name,
        present: sql<number>`count(*) filter (where ${studentAttendance.status} = 'present')::int`,
        late: sql<number>`count(*) filter (where ${studentAttendance.status} = 'late')::int`,
        absent: sql<number>`count(*) filter (where ${studentAttendance.status} = 'absent')::int`,
        excused: sql<number>`count(*) filter (where ${studentAttendance.status} = 'excused')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(studentAttendance)
      .leftJoin(classes, eq(studentAttendance.classId, classes.id))
      .leftJoin(grades, eq(classes.gradeId, grades.id))
      .leftJoin(sections, eq(classes.sectionId, sections.id))
      .where(where)
      .groupBy(
        sql`date_trunc('day', ${studentAttendance.date})`,
        studentAttendance.classId,
        classes.name,
        grades.level,
        sections.name
      )
      .orderBy(sql`date_trunc('day', ${studentAttendance.date}) desc`)

    const totals = daily.reduce(
      (acc, row) => ({
        present: acc.present + (row.present ?? 0),
        late: acc.late + (row.late ?? 0),
        absent: acc.absent + (row.absent ?? 0),
        excused: acc.excused + (row.excused ?? 0),
        total: acc.total + (row.total ?? 0),
      }),
      { present: 0, late: 0, absent: 0, excused: 0, total: 0 }
    )

    const byClass = new Map<string, { classId: string; className: string; gradeLevel: number | null; sectionName: string | null; present: number; late: number; absent: number; excused: number; total: number }>()
    for (const row of daily) {
      const key = row.classId ?? 'unknown'
      const entry = byClass.get(key) ?? {
        classId: row.classId ?? '',
        className: row.className ?? '',
        gradeLevel: row.gradeLevel,
        sectionName: row.sectionName,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: 0,
      }
      entry.present += row.present ?? 0
      entry.late += row.late ?? 0
      entry.absent += row.absent ?? 0
      entry.excused += row.excused ?? 0
      entry.total += row.total ?? 0
      byClass.set(key, entry)
    }

    const studentCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), sql`${students.status} <> 'deleted'`))

    return ok({
      range: { from: isoDate(from), to: isoDate(to) },
      totals: {
        ...totals,
        rate: totals.total > 0 ? Number((((totals.present + totals.late) / totals.total) * 100).toFixed(2)) : 0,
        studentCount: studentCount[0]?.count ?? 0,
      },
      rows: daily.map((row) => ({
        date: row.date,
        dateLabel: row.date ? isoDate(new Date(row.date)) : null,
        classId: row.classId,
        className: row.className,
        gradeLevel: row.gradeLevel,
        sectionName: row.sectionName,
        present: row.present ?? 0,
        late: row.late ?? 0,
        absent: row.absent ?? 0,
        excused: row.excused ?? 0,
        total: row.total ?? 0,
      })),
      byClass: Array.from(byClass.values()),
    })
  })(request)
}
