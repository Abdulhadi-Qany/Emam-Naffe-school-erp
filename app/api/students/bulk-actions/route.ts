import { db } from '@/lib/db'
import { students } from '@/lib/db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { ok, badRequest, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['active', 'inactive', 'graduated', 'transferred', 'dropped', 'deleted', 'alumni'] as const
const ACTIONS = ['status', 'class'] as const

/**
 * POST /api/students/bulk-actions
 * { action: 'status' | 'class', studentIds: string[], status?, gradeId?, sectionId? }
 * → bulk update with an audit trail (max 500 rows per call).
 */
export async function POST(request: NextRequest) {
  return withV1('students:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const action = body.action as string
    const studentIds = body.studentIds as string[] | undefined
    if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
      return badRequest(`action must be one of: ${ACTIONS.join(', ')}`)
    }
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return badRequest('studentIds must be a non-empty array')
    }
    if (studentIds.length > 500) return unprocessable('Bulk actions are limited to 500 students', 'TOO_MANY')

    let set: Record<string, unknown>
    if (action === 'status') {
      const status = body.status as string
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
        return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
      }
      set = { status: status as never, updatedAt: new Date() }
    } else {
      const gradeId = body.gradeId as string | undefined
      const sectionId = body.sectionId as string | undefined
      if (!gradeId || !sectionId) return badRequest('gradeId and sectionId are required')
      set = { currentGradeId: gradeId, currentSectionId: sectionId, updatedAt: new Date() }
    }

    const updated = await db
      .update(students)
      .set(set as never)
      .where(and(eq(students.schoolId, schoolId), inArray(students.id, studentIds)))
      .returning({ id: students.id })

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'students',
      entityType: 'student_bulk_action',
      entityId: action,
      changes: { action, count: updated.length, studentIds: studentIds.slice(0, 20) },
    })

    return ok({ action, updatedCount: updated.length })
  })(request)
}
