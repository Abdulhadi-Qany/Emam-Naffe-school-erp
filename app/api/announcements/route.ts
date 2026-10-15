import { db } from '@/lib/db'
import { announcements, users, userProfiles } from '@/lib/db/schema'
import { and, desc, eq, ilike, or, sql, count } from 'drizzle-orm'
import { paged, created, ok, deleted, badRequest, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

const CATEGORIES = ['academic', 'general', 'event', 'urgent'] as const
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const STATUSES = ['draft', 'published', 'scheduled', 'archived'] as const

/**
 * Announcements.
 * GET  /api/announcements?status&category&priority&query â†’ trilingual notices
 * POST /api/announcements { title, description, category, priority, targetAudience[], publishDate? }
 */
export async function GET(request: NextRequest) {
  return withV1('announcements:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'category', 'priority'])
    const query = searchParams.get('query')

    const conditions = [eq(announcements.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(announcements.status, filters.status))
    if (filters.category) conditions.push(eq(announcements.category, filters.category))
    if (filters.priority) conditions.push(eq(announcements.priority, filters.priority as never))
    if (query) conditions.push(ilike(announcements.title, `%${query}%`))

    const [totalResult] = await db.select({ count: count() }).from(announcements).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        announcement: announcements,
        createdByName: userProfiles.fullName,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(announcements.publishDate))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ announcement, createdByName }) => ({
        id: announcement.id,
        noticeId: `NOT-${announcement.id.slice(0, 6).toUpperCase()}`,
        title: announcement.title,
        titleDari: announcement.titleDari,
        titlePashto: announcement.titlePashto,
        description: announcement.description,
        descriptionDari: announcement.descriptionDari,
        descriptionPashto: announcement.descriptionPashto,
        category: announcement.category,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience,
        date: announcement.publishDate ? announcement.publishDate.toISOString().slice(0, 10) : null,
        publishDate: announcement.publishDate,
        expiryDate: announcement.expiryDate,
        isPinned: announcement.isPinned,
        viewCount: announcement.viewCount,
        attachment: announcement.attachment,
        status: announcement.status,
        createdByName,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('announcements:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['title', 'description', 'category']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }
    if (!CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])) {
      return badRequest(`category must be one of: ${CATEGORIES.join(', ')}`)
    }
    if (body.priority !== undefined && !PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])) {
      return badRequest(`priority must be one of: ${PRIORITIES.join(', ')}`)
    }
    if (body.status !== undefined && !STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
    }

    const targetAudience = Array.isArray(body.targetAudience) ? (body.targetAudience as never[]) : ['all']

    const [createdRow] = (await db
      .insert(announcements)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        title: String(body.title).trim(),
        titleDari: (body.titleDari as string) ?? null,
        titlePashto: (body.titlePashto as string) ?? null,
        description: String(body.description),
        descriptionDari: (body.descriptionDari as string) ?? null,
        descriptionPashto: (body.descriptionPashto as string) ?? null,
        category: body.category as string,
        priority: (body.priority as never) ?? 'medium',
        targetAudience,
        targetGrades: (body.targetGrades as never[]) ?? [],
        targetClasses: (body.targetClasses as never[]) ?? [],
        attachment: (body.attachment as string) ?? null,
        publishDate: body.publishDate ? new Date(body.publishDate as string) : new Date(),
        expiryDate: body.expiryDate ? new Date(body.expiryDate as string) : null,
        isPinned: body.isPinned === true,
        createdBy: user.id,
        status: (body.status as string) ?? 'published',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'engagement',
      entityType: 'announcement',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
