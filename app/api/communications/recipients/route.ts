import { db } from '@/lib/db'
import { staff, user } from '@/lib/db/schema'
import { and, eq, isNotNull, ne } from 'drizzle-orm'
import { ok, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('communications:read', async ({ schoolId, user: currentUser }) => {
    const recipients = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(staff)
      .innerJoin(user, eq(staff.userId, user.id))
      .where(and(
        eq(staff.schoolId, schoolId),
        eq(staff.status, 'active'),
        isNotNull(staff.userId),
        ne(user.id, currentUser.id)
      ))
      .orderBy(user.name)

    return ok({ recipients })
  })(request)
}
