import { db } from '@/lib/db'
import { staffContracts } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('hr:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'staffId', 'contractType'])
    const query = searchParams.get('query')

    const conditions = [eq(staffContracts.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(staffContracts.status, filters.status))
    if (filters.staffId) conditions.push(eq(staffContracts.staffId, filters.staffId))
    if (filters.contractType) conditions.push(eq(staffContracts.contractType, filters.contractType))
    if (query) conditions.push(sql`${staffContracts.contractNumber} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(staffContracts).where(and(...conditions))
    const rows = await db.select().from(staffContracts).where(and(...conditions)).orderBy(desc(staffContracts.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('hr:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['staffId', 'contractNumber', 'startDate', 'contractType']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [duplicate] = await db.select({ id: staffContracts.id }).from(staffContracts).where(sql`${staffContracts.contractNumber} = ${String(body.contractNumber).trim()}`).limit(1)
    if (duplicate) return conflict('A contract with this number already exists')

    const [createdRow] = (await db
      .insert(staffContracts)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        staffId: body.staffId as string,
        contractNumber: String(body.contractNumber).trim(),
        contractType: String(body.contractType),
        startDate: new Date(body.startDate as string),
        endDate: body.endDate ? new Date(body.endDate as string) : null,
        salary: String(body.salary),
        status: (body.status as string) ?? 'active',
        documentUrl: (body.documentUrl as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'hr', entityType: 'staff_contract', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}