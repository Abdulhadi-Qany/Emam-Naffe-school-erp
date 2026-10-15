import { db } from '@/lib/db'
import { users, userProfiles, staffRoles } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, withV1, parsePagination } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * IT portal user management.
 * GET /api/it-portal/users?page&limit&query → users with profile names and roles.
 */
export async function GET(request: NextRequest) {
  return withV1('users:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams, { maxLimit: 200 })
    const query = searchParams.get('query')

    const conditions = [eq(staffRoles.schoolId, schoolId)]
    if (query) conditions.push(sql`${users.email} ilike ${`%${query}%`}`)

    const rows = await db
      .select({
        userId: users.id,
        email: users.email,
        lastLoginAt: users.lastLoginAt,
        status: users.status,
        fullName: userProfiles.fullName,
        role: staffRoles.role,
        permissions: staffRoles.permissions,
      })
      .from(staffRoles)
      .innerJoin(users, eq(staffRoles.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(staffRoles.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(staffRoles).where(and(...conditions))

    return ok({
      users: rows.map((row) => ({
        userId: row.userId,
        email: row.email,
        fullName: row.fullName ?? row.email,
        role: row.role,
        permissions: row.permissions,
        lastLoginAt: row.lastLoginAt,
        lastLoginLabel: row.lastLoginAt ? row.lastLoginAt.toISOString().slice(0, 16).replace('T', ' ') : null,
        status: row.status,
      })),
      total: Number(total?.count ?? 0),
      page: pagination.page,
      limit: pagination.limit,
    })
  })(request)
}
