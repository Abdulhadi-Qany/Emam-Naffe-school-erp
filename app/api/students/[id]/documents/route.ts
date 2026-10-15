import { db } from '@/lib/db'
import { studentDocuments, students } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { ok, created, badRequest, notFound, withV1, audit, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Student documents (tazkira, certificates, uploads).
 * GET  /api/students/[id]/documents?type&status
 * POST /api/students/[id]/documents { documentType, title, fileUrl, mimeType?, fileSize? }
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:read', async ({ schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    const { searchParams } = new URL(req.url)
    const filters = parseFilters(searchParams, ['documentType', 'status'])

    const conditions = [eq(studentDocuments.studentId, id)]
    if (filters.documentType) conditions.push(eq(studentDocuments.documentType, filters.documentType))
    if (filters.status) conditions.push(eq(studentDocuments.status, filters.status))

    const documents = await db
      .select()
      .from(studentDocuments)
      .where(and(...conditions))
      .orderBy(desc(studentDocuments.createdAt))

    return ok({
      documents: documents.map((document) => ({
        ...document,
        uploadedAtLabel: document.createdAt ? document.createdAt.toISOString().slice(0, 10) : null,
      })),
    })
  })(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['documentType', 'title', 'fileUrl']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [createdRow] = (await db
      .insert(studentDocuments)
      .values({
        id: crypto.randomUUID(),
        studentId: id,
        documentType: String(body.documentType),
        title: String(body.title),
        fileUrl: String(body.fileUrl),
        mimeType: (body.mimeType as string) ?? null,
        fileSize: body.fileSize !== undefined ? Number(body.fileSize) : null,
        status: (body.status as string) ?? 'pending',
        uploadedBy: user.id,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'uploaded',
      module: 'students',
      entityType: 'student_document',
      entityId: createdRow.id as string,
      changes: { studentId: id, documentType: body.documentType },
    })

    return created(createdRow)
  })(request)
}
