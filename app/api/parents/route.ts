import { db } from '@/lib/db'
import { studentGuardians, students } from '@/lib/db/schema'
import { and, eq, ilike, or, sql } from 'drizzle-orm'
import { paged, parsePagination, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

const guardianKey = sql`coalesce(
  ${studentGuardians.userId}::text,
  nullif(lower(concat_ws('|', ${studentGuardians.mobile}, ${studentGuardians.phone}, ${studentGuardians.email}, ${studentGuardians.name})), ''),
  ${studentGuardians.id}
)`

export async function GET(request: NextRequest) {
  return withV1('students:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const relation = searchParams.get('relation')
    const query = searchParams.get('query')
    const conditions = [
      eq(students.schoolId, schoolId),
      sql`${students.status} <> 'deleted'`,
    ]
    if (relation) conditions.push(eq(studentGuardians.relationship, relation))
    if (query) {
      const pattern = `%${query}%`
      conditions.push(or(
        ilike(studentGuardians.name, pattern),
        ilike(studentGuardians.mobile, pattern),
        ilike(studentGuardians.phone, pattern),
        ilike(studentGuardians.email, pattern),
        ilike(studentGuardians.relationship, pattern)
      )!)
    }
    const where = and(...conditions)

    const [totalResult] = await db
      .select({ total: sql<number>`count(distinct ${guardianKey})::int` })
      .from(studentGuardians)
      .innerJoin(students, eq(studentGuardians.studentId, students.id))
      .where(where)

    const rows = await db
      .select({
        identity: guardianKey,
        id: sql<string>`min(${studentGuardians.id})`,
        name: sql<string>`min(${studentGuardians.name})`,
        relationship: sql<string>`min(${studentGuardians.relationship})`,
        mobile: sql<string | null>`min(coalesce(${studentGuardians.mobile}, ${studentGuardians.phone}))`,
        email: sql<string | null>`min(${studentGuardians.email})`,
        linkedChildren: sql<number>`count(distinct ${students.id})::int`,
        childNames: sql<string[]>`coalesce(array_agg(distinct ${students.fullName}) filter (where ${students.id} is not null), '{}')`,
        portalAccess: sql<boolean>`bool_or(${studentGuardians.userId} is not null)`,
        createdAt: sql<Date>`min(${studentGuardians.createdAt})`,
      })
      .from(studentGuardians)
      .innerJoin(students, eq(studentGuardians.studentId, students.id))
      .where(where)
      .groupBy(guardianKey)
      .orderBy(sql`min(${studentGuardians.name}) asc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map((row) => ({
        id: row.id,
        guardianId: row.id,
        name: row.name,
        relation: row.relationship,
        mobile: row.mobile,
        email: row.email,
        linkedChildren: row.linkedChildren,
        childNames: row.childNames,
        portalAccess: row.portalAccess,
        status: 'active',
        createdAt: row.createdAt,
      })),
      pagination,
      totalResult?.total ?? 0
    )
  })(request)
}
