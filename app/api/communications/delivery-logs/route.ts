import { db } from '@/lib/db'
import { smsMessages, emailMessages } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, withV1, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('communications:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const filters = parseFilters(searchParams, ['status', 'channel'])
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

    const smsRows = filters.channel && filters.channel !== 'sms' ? [] : await db
      .select().from(smsMessages).where(and(eq(smsMessages.schoolId, schoolId), filters.status ? eq(smsMessages.status, filters.status) : sql`true`)).orderBy(desc(smsMessages.createdAt)).limit(200)

    const emailRows = filters.channel && filters.channel !== 'email' ? [] : await db.select().from(emailMessages).where(and(eq(emailMessages.schoolId, schoolId), filters.status ? eq(emailMessages.status, filters.status) : sql`true`)).orderBy(desc(emailMessages.createdAt)).limit(200)

    return ok({
      sms: smsRows.map(row => ({ ...row, channel: 'sms', dateLabel: row.createdAt ? row.createdAt.toISOString().slice(0, 16).replace('T', ' ') : null })),
      email: emailRows.map(row => ({ ...row, channel: 'email', dateLabel: row.createdAt ? row.createdAt.toISOString().slice(0, 16).replace('T', ' ') : null })),
    })
  })(request)
}