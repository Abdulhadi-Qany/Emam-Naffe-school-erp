import { db } from '@/lib/db'
import { studentAttendance, students, classes as classesTable, grades as gradesTable, sections as sectionsTable } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, badRequest, withV1, isoDate, startOfDay, endOfDay } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/attendance/daily-summary?date=YYYY-MM-DD
 * â†’ per-class present/late/absent/total counts for a single day, plus the
 *    staff register progress (classes with no rows yet are listed as missing).
 */
export async function GET(request: NextRequest) {
  return withV1('attendance:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date') ?? isoDate(new Date())
    const date = startOfDay(new Date(dateParam))
    if (Number.isNaN(date.getTime())) return badRequest('date must be a valid date')

    const classes = await db
      .select({
        id: classesTable.id,
        name: classesTable.name,
        gradeLevel: gradesTable.level,
        sectionName: sectionsTable.name,
        studentCount: sql<number>`(
          select count(*)::int from ${students} s
          where s.current_grade_id = "classes"."grade_id"
            and s.current_section_id = "classes"."section_id"
            and s.school_id = ${schoolId}
            and s.status <> 'deleted'
        )`,
      })
      .from(classesTable)
      .leftJoin(gradesTable, eq(classesTable.gradeId, gradesTable.id))
      .leftJoin(sectionsTable, eq(classesTable.sectionId, sectionsTable.id))
      .where(and(eq(classesTable.schoolId, schoolId), sql`${classesTable.status} <> 'deleted'`))
      .orderBy(sql`${gradesTable.level} asc, ${sectionsTable.name} asc`)

    const rows = await db
      .select({
        classId: studentAttendance.classId,
        present: sql<number>`count(*) filter (where ${studentAttendance.status} = 'present')::int`,
        late: sql<number>`count(*) filter (where ${studentAttendance.status} = 'late')::int`,
        absent: sql<number>`count(*) filter (where ${studentAttendance.status} = 'absent')::int`,
        excused: sql<number>`count(*) filter (where ${studentAttendance.status} = 'excused')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(studentAttendance)
      .where(and(
        eq(studentAttendance.schoolId, schoolId),
        sql`${studentAttendance.date} >= ${date} and ${studentAttendance.date} <= ${endOfDay(date)}`
      ))
      .groupBy(studentAttendance.classId)

    const byClass = new Map(rows.map((row) => [row.classId, row]))

    const summary = classes.map((cls) => {
      const counts = byClass.get(cls.id)
      return {
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        sectionName: cls.sectionName,
        studentCount: cls.studentCount ?? 0,
        present: counts?.present ?? 0,
        late: counts?.late ?? 0,
        absent: counts?.absent ?? 0,
        excused: counts?.excused ?? 0,
        marked: counts?.total ?? 0,
      }
    })

    const totals = summary.reduce(
      (acc, cls) => ({
        studentCount: acc.studentCount + cls.studentCount,
        present: acc.present + cls.present,
        late: acc.late + cls.late,
        absent: acc.absent + cls.absent,
        excused: acc.excused + cls.excused,
        marked: acc.marked + cls.marked,
      }),
      { studentCount: 0, present: 0, late: 0, absent: 0, excused: 0, marked: 0 }
    )

    return ok({ date: isoDate(date), totals, summary })
  })(request)
}
