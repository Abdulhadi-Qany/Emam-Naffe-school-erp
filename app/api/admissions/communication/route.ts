import { db } from '@/lib/db'
import { admissionApplications, admissionCommunications } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

const CHANNELS = ['email', 'sms', 'phone', 'in_person', 'portal'] as const

export async function GET(request: NextRequest) {
  return withV1('admissions:read', async ({ schoolId }) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['applicationId', 'channel', 'status'])
    const query = searchParams.get('query')
    const conditions = [eq(admissionCommunications.schoolId, schoolId)]

    if (filters.applicationId) conditions.push(eq(admissionCommunications.applicationId, filters.applicationId))
    if (filters.channel) conditions.push(eq(admissionCommunications.channel, filters.channel))
    if (filters.status) conditions.push(eq(admissionCommunications.status, filters.status))
    if (query) conditions.push(sql`${admissionCommunications.message} ilike ${`%${query}%`}`)

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(admissionCommunications)
      .where(and(...conditions))
    const rows = await db
      .select()
      .from(admissionCommunications)
      .where(and(...conditions))
      .orderBy(desc(admissionCommunications.sentAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('admissions:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')
    if (typeof body.applicationId !== 'string' || body.applicationId.trim() === '') {
      return badRequest('applicationId is required')
    }
    if (typeof body.message !== 'string' || body.message.trim() === '') {
      return badRequest('message is required')
    }
    if (typeof body.channel !== 'string' || !CHANNELS.includes(body.channel as (typeof CHANNELS)[number])) {
      return badRequest(`channel must be one of: ${CHANNELS.join(', ')}`)
    }

    const [application] = await db
      .select({ id: admissionApplications.id })
      .from(admissionApplications)
      .where(and(eq(admissionApplications.id, body.applicationId), eq(admissionApplications.schoolId, schoolId)))
      .limit(1)
    if (!application) return notFound('Admission application not found')

    const [row] = await db
      .insert(admissionCommunications)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        applicationId: application.id,
        channel: body.channel,
        recipient: typeof body.recipient === 'string' ? body.recipient : null,
        subject: typeof body.subject === 'string' ? body.subject : null,
        message: body.message.trim(),
        status: 'sent',
        sentAt: new Date(),
        createdBy: user.id,
      })
      .returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'admissions',
      entityType: 'admission_communication',
      entityId: row.id,
    })
    return created(row)
  })(request)
}
