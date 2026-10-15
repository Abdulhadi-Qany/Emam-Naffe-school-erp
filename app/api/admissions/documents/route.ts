import { db } from '@/lib/db'
import { admissionDocuments } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('admissions:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['documentType', 'status'])
    const query = searchParams.get('query')

    const conditions = [eq(admissionDocuments.schoolId, schoolId)]
    if (filters.documentType) conditions.push(eq(admissionDocuments.documentType, filters.documentType))
    if (filters.status) conditions.push(eq(admissionDocuments.status, filters.status))
    if (query) conditions.push(sql`${admissionDocuments.documentType} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(admissionDocuments).where(and(...conditions))
    const rows = await db.select().from(admissionDocuments).where(and(...conditions)).orderBy(desc(admissionDocuments.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('admissions:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['applicationId', 'documentType', 'fileUrl']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [createdRow] = (await db
      .insert(admissionDocuments)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        applicationId: body.applicationId as string,
        documentType: String(body.documentType),
        fileUrl: String(body.fileUrl),
        status: 'pending',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'admissions',
      entityType: 'admission_document',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}