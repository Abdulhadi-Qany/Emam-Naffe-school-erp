import { db } from '@/lib/db'
import { substitutions, timetableEntries, staff, classes, subjects } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, withV1, audit, startOfDay, isoDate } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Teacher substitutions (cover for absent teachers).
 * GET  /api/academic/timetable/substitutions?from&to&status
 * POST /api/academic/timetable/substitutions { timetableEntryId, substituteTeacherId, date, reason? }
 *      → records the substitution and updates the timetable entry
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = [eq(substitutions.schoolId, schoolId)]
    if (status) conditions.push(eq(substitutions.status, status))
    if (from) conditions.push(sql`${substitutions.date} >= ${startOfDay(new Date(from))}`)
    if (to) conditions.push(sql`${substitutions.date} <= ${new Date(to)}`)

    const rows = await db
      .select({
        substitution: substitutions,
        originalTeacherName: sql<string>`(select full_name from staff where id = ${substitutions.originalTeacherId})`,
        substituteTeacherName: sql<string>`(select full_name from staff where id = ${substitutions.substituteTeacherId})`,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(substitutions)
      .leftJoin(classes, eq(substitutions.classId, classes.id))
      .leftJoin(subjects, eq(substitutions.subjectId, subjects.id))
      .where(and(...conditions))
      .orderBy(sql`${substitutions.date} desc`)

    return ok({
      rows: rows.map(({ substitution, originalTeacherName, substituteTeacherName, className, subjectName }) => ({
        ...substitution,
        dateLabel: isoDate(substitution.date),
        originalTeacherName,
        substituteTeacherName,
        className,
        subjectName,
      })),
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('academics:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const timetableEntryId = body.timetableEntryId as string
    const substituteTeacherId = body.substituteTeacherId as string
    const dateRaw = body.date as string

    if (!timetableEntryId || !substituteTeacherId || !dateRaw) {
      return badRequest('timetableEntryId, substituteTeacherId and date are required')
    }

    const date = startOfDay(new Date(dateRaw))
    if (Number.isNaN(date.getTime())) return badRequest('date must be a valid date')

    const [entry] = await db
      .select()
      .from(timetableEntries)
      .where(and(eq(timetableEntries.id, timetableEntryId), eq(timetableEntries.schoolId, schoolId)))
      .limit(1)
    if (!entry) return notFound('Timetable entry not found')

    const [substitute] = await db.select({ id: staff.id }).from(staff).where(eq(staff.id, substituteTeacherId)).limit(1)
    if (!substitute) return badRequest('substituteTeacherId does not reference staff')

    const [createdRow] = (await db
      .insert(substitutions)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        originalTeacherId: entry.teacherId,
        substituteTeacherId,
        classId: entry.classId,
        subjectId: entry.subjectId,
        periodId: entry.periodId,
        date,
        reason: (body.reason as string) ?? null,
        status: 'confirmed',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await db.update(timetableEntries).set({ teacherId: substituteTeacherId, updatedAt: new Date() }).where(eq(timetableEntries.id, entry.id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'substitution',
      entityId: createdRow.id as string,
      changes: { timetableEntryId, substituteTeacherId },
    })

    return created(createdRow)
  })(request)
}
