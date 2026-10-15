import { db } from '@/lib/db'
import { admissionOffers, admissionApplications, grades, sections } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('admissions:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'applicationId'])
    const query = searchParams.get('query')

    const conditions = [eq(admissionOffers.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(admissionOffers.status, filters.status))
    if (filters.applicationId) conditions.push(eq(admissionOffers.applicationId, filters.applicationId))
    if (query) conditions.push(sql`${admissionOffers.offerNumber} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(admissionOffers).where(and(...conditions))
    const rows = await db.select().from(admissionOffers).where(and(...conditions)).orderBy(desc(admissionOffers.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('admissions:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['applicationId', 'offerNumber', 'expiresAt']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [duplicate] = await db
      .select({ id: admissionOffers.id })
      .from(admissionOffers)
      .where(sql`${admissionOffers.offerNumber} = ${String(body.offerNumber).trim()}`)
      .limit(1)
    if (duplicate) return conflict('Offer number already exists')

    const [createdRow] = (await db
      .insert(admissionOffers)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        applicationId: body.applicationId as string,
        offerNumber: String(body.offerNumber).trim(),
        issuedAt: new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt as string) : null,
        depositAmount: body.depositAmount !== undefined ? String(body.depositAmount) : '0',
        status: 'issued',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'admissions',
      entityType: 'admission_offer',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}