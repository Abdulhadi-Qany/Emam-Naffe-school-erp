import { db } from '@/lib/db'
import {
  students,
  staff,
  classes,
  grades,
  sections,
  studentAttendance,
  payments,
  invoices,
  admissionApplications,
  staffAttendance,
  staffLeave,
  events,
  auditLogs,
  userProfiles,
  hostelAllocations,
} from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, num, round } from '@/lib/api'
import { resolveSchoolId as getSchoolId } from '@/src/infrastructure/http/middleware/school'
import type { NextRequest } from 'next/server'

const DEFAULT_SCHOOL_ID = 'emam-bukhari-private-school'

/**
 * GET /api/dashboard/overview - the single payload the ERP home page renders:
 * KPI tiles, class capacity, today's attendance, collections, upcoming events
 * and the recent-activity feed.
 */
export async function GET(request: NextRequest) {
  const schoolId = getSchoolId(request) ?? request.headers.get('x-school-id') ?? DEFAULT_SCHOOL_ID
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today.getTime() + 86_400_000)

  const [studentCount] = await db
    .select({ count: sql<number>`count(*)::int`, newThisMonth: sql<number>`count(*) filter (where ${students.enrollmentDate} >= date_trunc('month', now()))::int` })
    .from(students)
    .where(and(eq(students.schoolId, schoolId), sql`${students.status} <> 'deleted'`))

  const [staffCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staff)
    .where(and(eq(staff.schoolId, schoolId), eq(staff.status, 'active')))

  const [attendance] = await db
    .select({
      present: sql<number>`count(*) filter (where ${studentAttendance.status} = 'present')::int`,
      attended: sql<number>`count(*) filter (where ${studentAttendance.status} in ('present', 'late'))::int`,
      absent: sql<number>`count(*) filter (where ${studentAttendance.status} = 'absent')::int`,
      late: sql<number>`count(*) filter (where ${studentAttendance.status} = 'late')::int`,
      marked: sql<number>`count(*)::int`,
    })
    .from(studentAttendance)
    .where(and(eq(studentAttendance.schoolId, schoolId), sql`${studentAttendance.date} >= ${today} and ${studentAttendance.date} < ${tomorrow}`))

  const [collections] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)`, count: sql<number>`count(*)::int` })
    .from(payments)
    .where(and(
      eq(payments.schoolId, schoolId),
      eq(payments.paymentStatus, 'completed'),
      sql`${payments.paymentDate} >= date_trunc('month', now())`
    ))

  const [outstanding] = await db
    .select({ total: sql<number>`coalesce(sum(${invoices.balanceAmount}), 0)` })
    .from(invoices)
    .where(and(eq(invoices.schoolId, schoolId), sql`${invoices.status} in ('pending', 'partial', 'overdue')`))

  const [overdueInvoices] = await db
    .select({
      amount: sql<number>`coalesce(sum(${invoices.balanceAmount}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(and(
      eq(invoices.schoolId, schoolId),
      sql`${invoices.status} in ('pending', 'partial', 'overdue')`,
      sql`${invoices.dueDate} < now()`
    ))

  const [pendingAdmissions] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(admissionApplications)
    .where(and(eq(admissionApplications.schoolId, schoolId), sql`${admissionApplications.status} in ('submitted', 'document_verification')`))

  const [pendingLeave] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staffLeave)
    .innerJoin(staff, eq(staffLeave.staffId, staff.id))
    .where(and(eq(staff.schoolId, schoolId), eq(staffLeave.status, 'pending')))

  const [staffOnCampus] = await db
    .select({ count: sql<number>`count(distinct ${staffAttendance.staffId})::int` })
    .from(staffAttendance)
    .innerJoin(staff, eq(staffAttendance.staffId, staff.id))
    .where(and(
      eq(staff.schoolId, schoolId),
      eq(staff.status, 'active'),
      sql`${staffAttendance.date} >= ${today} and ${staffAttendance.date} < ${tomorrow}`,
      sql`${staffAttendance.status} in ('present', 'late')`
    ))

  const attendanceTrend = await db
    .select({
      date: sql<string>`to_char(${studentAttendance.date}::date, 'YYYY-MM-DD')`,
      present: sql<number>`count(*) filter (where ${studentAttendance.status} = 'present')::int`,
      attended: sql<number>`count(*) filter (where ${studentAttendance.status} in ('present', 'late'))::int`,
      marked: sql<number>`count(*)::int`,
    })
    .from(studentAttendance)
    .where(and(
      eq(studentAttendance.schoolId, schoolId),
      sql`${studentAttendance.date} >= current_date - interval '13 days'`
    ))
    .groupBy(sql`1`)
    .orderBy(sql`1`)

  const classCapacity = await db
    .select({
      id: classes.id,
      name: classes.name,
      gradeLevel: grades.level,
      sectionName: sections.name,
      capacity: classes.capacity,
      enrolled: sql<number>`(
        select count(*)::int from ${students} s
        where s.current_grade_id = ${classes.gradeId}
          and s.current_section_id = ${classes.sectionId}
          and s.school_id = ${schoolId}
          and s.status = 'active'
      )`,
    })
    .from(classes)
    .leftJoin(grades, eq(classes.gradeId, grades.id))
    .leftJoin(sections, eq(classes.sectionId, sections.id))
    .where(and(eq(classes.schoolId, schoolId), sql`${classes.status} <> 'deleted'`))
    .orderBy(sql`${grades.level} asc, ${sections.name} asc`)
    .limit(50)

  const upcomingEvents = await db
    .select()
    .from(events)
    .where(and(eq(events.schoolId, schoolId), sql`${events.endDate} >= now()`))
    .orderBy(sql`${events.startDate} asc`)
    .limit(5)

  const recentActivity = await db
    .select({
      entry: auditLogs,
      actor: userProfiles.fullName,
    })
    .from(auditLogs)
    .leftJoin(userProfiles, eq(auditLogs.userId, userProfiles.userId))
    .where(eq(auditLogs.schoolId, schoolId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(8)

  const [hostelOccupancy] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hostelAllocations)
    .where(and(eq(hostelAllocations.schoolId, schoolId), eq(hostelAllocations.status, 'active')))

  return ok({
    generatedAt: new Date().toISOString(),
    totals: {
      students: Number(studentCount?.count ?? 0),
      newStudents: Number(studentCount?.newThisMonth ?? 0),
      staff: Number(staffCount?.count ?? 0),
      staffOnCampus: Number(staffOnCampus?.count ?? 0),
      hostelResidents: Number(hostelOccupancy?.count ?? 0),
      collections: round(num(collections?.total)),
      paymentsCount: Number(collections?.count ?? 0),
      outstanding: round(num(outstanding?.total)),
      overdueAmount: round(num(overdueInvoices?.amount)),
      overdueInvoices: Number(overdueInvoices?.count ?? 0),
      pendingAdmissions: Number(pendingAdmissions?.count ?? 0),
      pendingLeave: Number(pendingLeave?.count ?? 0),
      attendance: {
        present: Number(attendance?.present ?? 0),
        attended: Number(attendance?.attended ?? 0),
        late: Number(attendance?.late ?? 0),
        absent: Number(attendance?.absent ?? 0),
        marked: Number(attendance?.marked ?? 0),
        rate: Number(attendance?.marked ?? 0) > 0
          ? round((Number(attendance.attended) / Number(attendance.marked)) * 100)
          : 0,
      },
    },
    classCapacity: classCapacity.map((cls) => ({
      id: cls.id,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      sectionName: cls.sectionName,
      enrolled: cls.enrolled ?? 0,
      capacity: cls.capacity ?? 0,
      utilization: (cls.capacity ?? 0) > 0 ? Math.round(((cls.enrolled ?? 0) / (cls.capacity ?? 1)) * 100) : 0,
    })),
    attendanceTrend: attendanceTrend.map((day) => ({
      date: day.date,
      present: Number(day.present ?? 0),
      attended: Number(day.attended ?? 0),
      marked: Number(day.marked ?? 0),
      rate: Number(day.marked ?? 0) > 0 ? round((Number(day.attended) / Number(day.marked)) * 100) : 0,
    })),
    upcomingEvents: upcomingEvents.map((event) => ({
      id: event.id,
      title: event.title,
      titleDari: event.titleDari,
      titlePashto: event.titlePashto,
      startDate: event.startDate,
      endDate: event.endDate,
      eventType: event.eventType,
      venue: event.venue,
      status: event.status,
    })),
    recentActivity: recentActivity.map(({ entry, actor }) => ({
      id: entry.id,
      actor: actor ?? 'System',
      action: entry.action,
      module: entry.module,
      target: `${entry.entityType} ${entry.entityId}`,
      detail: entry.changes ? JSON.stringify(entry.changes).slice(0, 200) : null,
      createdAt: entry.createdAt,
    })),
  })
}
