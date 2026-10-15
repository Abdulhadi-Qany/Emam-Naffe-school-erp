import { db } from '@/lib/db'
import {
  students,
  grades,
  sections,
  classes,
  studentGuardians,
  studentDocuments,
  studentHealthRecords,
  studentTimeline,
  studentTransport,
  hostels,
} from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, notFound, withV1, num, round } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/students/[id]/profile → composite profile payload (identity, guardians,
 * documents, health, transport, hostel and recent timeline) in one round trip.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [row] = await db
      .select({
        student: students,
        gradeId: grades.id,
        gradeName: grades.name,
        gradeLevel: grades.level,
        sectionId: sections.id,
        sectionName: sections.name,
        className: classes.name,
      })
      .from(students)
      .leftJoin(grades, eq(students.currentGradeId, grades.id))
      .leftJoin(sections, eq(students.currentSectionId, sections.id))
      .leftJoin(classes, and(eq(classes.gradeId, grades.id), eq(classes.sectionId, sections.id)))
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)

    if (!row) return notFound('Student not found')

    const [guardians, documents, health, timeline, transport] = await Promise.all([
      db.select().from(studentGuardians).where(eq(studentGuardians.studentId, id)),
      db.select().from(studentDocuments).where(eq(studentDocuments.studentId, id)).orderBy(desc(studentDocuments.createdAt)).limit(50),
      db.select().from(studentHealthRecords).where(eq(studentHealthRecords.studentId, id)).limit(50),
      db.select().from(studentTimeline).where(eq(studentTimeline.studentId, id)).orderBy(desc(studentTimeline.recordedAt)).limit(50),
      db
        .select({
          assignment: studentTransport,
          routeName: sql<string | null>`(select name from transport_routes where id = ${studentTransport.routeId})`,
          hostelName: sql<string | null>`(select name from hostels where id = (select hostel_id from hostel_rooms where id = (select room_id from hostel_allocations where student_id = ${students.id} limit 1)))`,
        })
        .from(studentTransport)
        .leftJoin(hostels, sql`false`)
        .where(eq(studentTransport.studentId, id))
        .limit(5),
    ])

    const attendance = await db
      .select({
        total: sql<number>`count(*)::int`,
        present: sql<number>`count(*) filter (where status in ('present', 'late'))::int`,
      })
      .from(sql`student_attendance`)
      .where(sql`student_id = ${id}`)

    const invoices = await db
      .select({
        total: sql<number>`coalesce(sum(total_amount), 0)`,
        paid: sql<number>`coalesce(sum(paid_amount), 0)`,
        balance: sql<number>`coalesce(sum(balance_amount), 0)`,
      })
      .from(sql`invoices`)
      .where(sql`student_id = ${id}`)

    const attendanceTotals = (attendance[0] ?? { total: 0, present: 0 }) as { total?: number; present?: number }
    const attendanceRate =
      Number(attendanceTotals.total ?? 0) > 0
        ? round((Number(attendanceTotals.present ?? 0) / Number(attendanceTotals.total)) * 1000) / 10
        : 0

    const financeTotals = (invoices[0] ?? { total: 0, paid: 0, balance: 0 }) as { total?: number; paid?: number; balance?: number }

    return ok({
      ...row.student,
      gradeId: row.gradeId,
      gradeName: row.gradeName,
      gradeNumber: row.gradeLevel !== null ? String(row.gradeLevel) : null,
      sectionId: row.sectionId,
      sectionName: row.sectionName,
      className: row.className,
      guardians: guardians.map((guardian) => ({ ...guardian })),
      documents: documents.map((document) => ({ ...document })),
      health: health.map((record) => ({ ...record })),
      timeline: timeline.map((event) => ({ ...event })),
      transport: transport.map((entry) => ({ ...entry.assignment, routeName: entry.routeName })),
      hostelName: transport[0]?.hostelName ?? null,
      attendance: {
        total: Number(attendanceTotals.total ?? 0),
        present: Number(attendanceTotals.present ?? 0),
        rate: attendanceRate,
      },
      finance: {
        billed: num(financeTotals.total),
        paid: num(financeTotals.paid),
        balance: num(financeTotals.balance),
      },
    })
  })(request, context)
}
