import { db } from '@/lib/db'
import { documentTemplates } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Document templates
 * GET  /api/documents/templates?category&query
 * POST /api/documents/templates { name, category, content, fields }
 */
export async function GET(request: NextRequest) {
  return withV1('documents:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['category'])
    const query = searchParams.get('query')

    const conditions = [eq(documentTemplates.schoolId, schoolId)]
    if (filters.category) conditions.push(eq(documentTemplates.category, filters.category))
    if (query) conditions.push(sql`${documentTemplates.name} ilike ${'%' + query + '%'}`)

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(documentTemplates).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select()
      .from(documentTemplates)
      .where(and(...conditions))
      .orderBy(desc(documentTemplates.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('documents:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['name', 'category', 'content']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [createdRow] = (await db
      .insert(documentTemplates)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name: String(body.name).trim(),
        category: String(body.category),
        mergeFields: (body.fields as never[]) ?? [],
        createdBy: user.id,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'documents', entityType: 'document_template', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}