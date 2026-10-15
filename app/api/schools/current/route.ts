import { db } from '@/lib/db'
import { schools, schoolBranches } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, withV1 } from '@/lib/api'

/**
 * GET /api/schools/current — the school profile driving the ERP shell,
 * including its branches. Resolves via `x-school-id` → `?schoolId` → default.
 */
export const GET = withV1('settings:read', async ({ schoolId }) => {
  const [school] = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1)
  if (!school) {
    const [fallback] = await db.select().from(schools).limit(1)
    if (!fallback) return ok(null)
    const fallbackBranches = await db
      .select()
      .from(schoolBranches)
      .where(eq(schoolBranches.schoolId, fallback.id))
    return ok({ ...fallback, branches: fallbackBranches })
  }

  const branches = await db.select().from(schoolBranches).where(eq(schoolBranches.schoolId, schoolId))
  return ok({ ...school, branches })
})
