import { db } from '@/lib/db'
import { classes, grades, sections, rooms, students, timetableEntries, staff } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { ok, notFound, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/academic/classes/[id]/overview — one round-trip payload for the
 * class overview page: class, roster, timetable slot count and its teachers.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:read', async (_ctx, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [row] = await db
      .select({
        id: classes.id,
        schoolId: classes.schoolId,
        name: classes.name,
        status: classes.status,
        capacity: classes.capacity,
        gradeId: grades.id,
        gradeName: grades.name,
        gradeLevel: grades.level,
        sectionId: sections.id,
        sectionName: sections.name,
        roomLabel: rooms.name,
      })
      .from(classes)
      .leftJoin(grades, eq(classes.gradeId, grades.id))
      .leftJoin(sections, eq(classes.sectionId, sections.id))
      .leftJoin(rooms, eq(classes.roomId, rooms.id))
      .where(eq(classes.id, id))
      .limit(1)

    if (!row) return notFound('Class not found')

    const roster = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        admissionNumber: students.admissionNumber,
        status: students.status,
      })
      .from(students)
      .where(sql`
        ${students.currentGradeId} = ${row.gradeId}
        and ${students.currentSectionId} = ${row.sectionId}
        and ${students.status} <> 'deleted'
      `)
      .limit(100)

    const [timetableCount] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(timetableEntries)
      .where(eq(timetableEntries.classId, id))

    const teachers = await db
      .selectDistinct({ id: staff.id, fullName: staff.fullName })
      .from(timetableEntries)
      .innerJoin(staff, eq(timetableEntries.teacherId, staff.id))
      .where(eq(timetableEntries.classId, id))

    return ok({
      class: row,
      roster,
      timetableSlots: timetableCount?.total ?? 0,
      teachers,
    })
  })(request, context)
}
