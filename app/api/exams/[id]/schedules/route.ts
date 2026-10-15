import { db } from '@/lib/db'
import { exams, examSchedules, subjects, classes, rooms } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Exam schedules (subject/class/date/time/room/invigilators).
 * GET    /api/exams/[id]/schedules
 * POST   /api/exams/[id]/schedules { subjectId, classId, date, startTime, endTime, duration, roomId?, maxMarks?, passMarks? }
 * PUT    /api/exams/[id]/schedules/[scheduleId]
 * DELETE /api/exams/[id]/schedules/[scheduleId]
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [exam] = await db.select({ id: exams.id }).from(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).limit(1)
    if (!exam) return notFound('Exam not found')

    const rows = await db
      .select({
        schedule: examSchedules,
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        classId: classes.id,
        className: classes.name,
        roomLabel: rooms.name,
      })
      .from(examSchedules)
      .leftJoin(subjects, eq(examSchedules.subjectId, subjects.id))
      .leftJoin(classes, eq(examSchedules.classId, classes.id))
      .leftJoin(rooms, eq(examSchedules.roomId, rooms.id))
      .where(eq(examSchedules.examId, id))
      .orderBy(sql`${examSchedules.date} asc`)

    return ok({
      schedules: rows.map(({ schedule, subjectId, subjectName, subjectCode, classId, className, roomLabel }) => ({
        ...schedule,
        dateLabel: schedule.date ? schedule.date.toISOString().slice(0, 10) : null,
        subjectId,
        subjectName,
        subjectCode,
        classId,
        className,
        roomLabel,
      })),
    })
  })(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [exam] = await db.select({ id: exams.id, status: exams.status }).from(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).limit(1)
    if (!exam) return notFound('Exam not found')
    if (exam.status === 'completed') return badRequest('Schedules cannot change after the exam is published')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['subjectId', 'classId', 'date', 'startTime', 'endTime', 'duration']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const date = new Date(body.date as string)
    if (Number.isNaN(date.getTime())) return badRequest('date must be a valid date')

    const [duplicate] = await db
      .select({ id: examSchedules.id })
      .from(examSchedules)
      .where(sql`${examSchedules.examId} = ${id} and ${examSchedules.classId} = ${body.classId} and ${examSchedules.subjectId} = ${body.subjectId}`)
      .limit(1)
    if (duplicate) return badRequest('This class/subject is already scheduled for this exam')

    const [createdRow] = (await db
      .insert(examSchedules)
      .values({
        id: crypto.randomUUID(),
        examId: id,
        subjectId: body.subjectId as string,
        classId: body.classId as string,
        date,
        startTime: String(body.startTime),
        endTime: String(body.endTime),
        duration: Number(body.duration),
        roomId: (body.roomId as string) ?? null,
        maxMarks: body.maxMarks !== undefined ? String(body.maxMarks) : '100',
        passMarks: body.passMarks !== undefined ? String(body.passMarks) : '40',
        invigilators: (body.invigilators as never[]) ?? [],
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'exam_schedule',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request, context)
}
