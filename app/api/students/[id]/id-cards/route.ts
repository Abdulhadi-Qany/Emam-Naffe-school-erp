import { db } from '@/lib/db'
import { students, studentIdCards } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, badRequest, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET  /api/students/[id]/id-cards → the student's ID card history
 * POST /api/students/[id]/id-cards { reason? } → issues (re-issues) an ID card
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return badRequest('Student not found')

    const cards = await db
      .select()
      .from(studentIdCards)
      .where(eq(studentIdCards.studentId, id))
      .orderBy(sql`${studentIdCards.createdAt} desc`)
      .limit(20)

    return ok({ cards })
  })(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [student] = await db
      .select({ id: students.id, status: students.status })
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return badRequest('Student not found')
    if (student.status === 'deleted' || student.status === 'dropped_out') {
      return unprocessable('Only active students can have ID cards issued', 'INVALID_STATUS')
    }

    const [card] = (await db
      .insert(studentIdCards)
      .values({
        id: crypto.randomUUID(),
        studentId: id,
        cardNumber: `EBPS-ID-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 86_400_000),
        status: 'active',
        printedBy: user.id,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'students',
      entityType: 'student_id_card',
      entityId: card.id as string,
      changes: { studentId: id },
    })

    return ok(card)
  })(request)
}
