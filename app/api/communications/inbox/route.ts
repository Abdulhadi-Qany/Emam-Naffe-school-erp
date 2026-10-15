import { db } from '@/lib/db'
import { communications } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, withV1, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('communications:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const filters = parseFilters(searchParams, ['status', 'channel'])
    const query = searchParams.get('query')

    const conditions = [eq(communications.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(communications.status, filters.status))
    if (filters.channel) conditions.push(eq(communications.channel, filters.channel))
    if (query) conditions.push(sql`${communications.message} ilike ${'%' + query + '%'}`)

    const rows = await db.select().from(communications).where(and(...conditions)).orderBy(desc(communications.createdAt)).limit(200)

    return ok({ messages: rows })
  })(request)
}