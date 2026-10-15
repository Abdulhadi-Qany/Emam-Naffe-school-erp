import { db } from '@/lib/db'
import { homework, subjects, classes, staff, homeworkSubmissions } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Homework assignments.
 * GET  /api/homework?classId&subjectId&teacherId&status&query
 *      → joins subject/class/teacher and computes submission counts
 * POST /api/homework { title, subjectId, classId, teacherId, dueDate, description?, type?, maxMarks? }
 */
export async function GET(request: NextRequest) {
  return withV1('homework:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['classId', 'subjectId', 'teacherId', 'status', 'type'])
    const query = searchParams.get('query')

    const conditions = [eq(homework.schoolId, schoolId)]
    if (filters.classId) conditions.push(eq(homework.classId, filters.classId))
    if (filters.subjectId) conditions.push(eq(homework.subjectId, filters.subjectId))
    if (filters.teacherId) conditions.push(eq(homework.teacherId, filters.teacherId))
    if (filters.status) conditions.push(eq(homework.status, filters.status))
    if (filters.type) conditions.push(eq(homework.type, filters.type))
    if (query) {
      const q = `%${query}%`
      conditions.push(sql`(${homework.title} ilike ${q} or ${homework.description} ilike ${q})`)
    }

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(homework).where(and(...conditions))
    const totalCount = total?.count ?? 0

    const rows = await db
      .select({
        assignment: homework,
        subjectId: subjects.id,
        subjectName: subjects.name,
        classId: classes.id,
        className: classes.name,
        teacherId: staff.id,
        teacherName: staff.fullName,
        submitted: sql<number>`(
          select count(*)::int from ${homeworkSubmissions} hs
          where hs.homework_id = "homework"."id" and hs.status <> 'pending'
        )`,
        graded: sql<number>`(
          select count(*)::int from ${homeworkSubmissions} hs
          where hs.homework_id = "homework"."id" and hs.status = 'graded'
        )`,
        totalStudents: sql<number>`(
          select count(*)::int from students s
          where s.school_id = ${homework.schoolId}
            and s.current_grade_id = ${classes.gradeId}
            and s.current_section_id = ${classes.sectionId}
            and s.status <> 'deleted'
        )`,
      })
      .from(homework)
      .leftJoin(subjects, and(eq(homework.subjectId, subjects.id), eq(subjects.schoolId, schoolId)))
      .leftJoin(classes, and(eq(homework.classId, classes.id), eq(classes.schoolId, schoolId)))
      .leftJoin(staff, and(eq(homework.teacherId, staff.id), eq(staff.schoolId, schoolId)))
      .where(and(...conditions))
      .orderBy(sql`${homework.dueDate} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ assignment, subjectId, subjectName, classId, className, teacherId, teacherName, submitted, graded, totalStudents }) => ({
        id: assignment.id,
        schoolId: assignment.schoolId,
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        status: assignment.status,
        maxMarks: assignment.maxMarks,
        attachments: assignment.attachments,
        assignedDate: assignment.assignedDate,
        assignedDateLabel: assignment.assignedDate ? assignment.assignedDate.toISOString().slice(0, 10) : null,
        dueDate: assignment.dueDate,
        dueDateLabel: assignment.dueDate ? assignment.dueDate.toISOString().slice(0, 10) : null,
        subjectId,
        subjectName,
        classId,
        className,
        teacherId,
        teacherName,
        submitted: submitted ?? 0,
        graded: graded ?? 0,
        totalStudents: totalStudents ?? 0,
      })),
      pagination,
      totalCount
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('homework:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['title', 'subjectId', 'classId', 'teacherId', 'dueDate']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const dueDate = new Date(body.dueDate as string)
    if (Number.isNaN(dueDate.getTime())) return badRequest('dueDate must be a valid date')

    const assignedDate = body.assignedDate ? new Date(body.assignedDate as string) : new Date()
    if (Number.isNaN(assignedDate.getTime())) return badRequest('assignedDate must be a valid date')
    const maxMarks = Number(body.maxMarks ?? 10)
    if (!Number.isFinite(maxMarks) || maxMarks <= 0) return badRequest('maxMarks must be a positive number')
    if (typeof body.title !== 'string' || !body.title.trim()) return badRequest('title must be a non-empty string')

    const [classRow] = await db.select({ id: classes.id }).from(classes)
      .where(and(eq(classes.id, String(body.classId)), eq(classes.schoolId, schoolId))).limit(1)
    if (!classRow) return badRequest('classId must belong to this school')
    const [subjectRow] = await db.select({ id: subjects.id }).from(subjects)
      .where(and(eq(subjects.id, String(body.subjectId)), eq(subjects.schoolId, schoolId))).limit(1)
    if (!subjectRow) return badRequest('subjectId must belong to this school')
    const [teacherRow] = await db.select({ id: staff.id }).from(staff)
      .where(and(eq(staff.id, String(body.teacherId)), eq(staff.schoolId, schoolId))).limit(1)
    if (!teacherRow) return badRequest('teacherId must belong to this school')

    const [createdRow] = (await db
      .insert(homework)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        title: body.title.trim(),
        description: (body.description as string) ?? null,
        subjectId: body.subjectId as string,
        classId: body.classId as string,
        teacherId: body.teacherId as string,
        assignedDate,
        dueDate,
        maxMarks: String(maxMarks),
        type: (body.type as string) ?? 'assignment',
        status: (body.status as string) ?? 'active',
        attachments: (body.attachments as never[]) ?? [],
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'homework',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
