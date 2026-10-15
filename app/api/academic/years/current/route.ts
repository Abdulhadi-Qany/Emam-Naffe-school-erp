import { db } from '@/lib/db'
import { academicYears, terms } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { ok, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/academic/years/current — the current academic year with its terms.
 * Falls back to the most recent year when none is flagged current.
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }) => {
    const [current] = await db
      .select()
      .from(academicYears)
      .where(sql`${academicYears.schoolId} = ${schoolId} and ${academicYears.isCurrent} = true`)
      .limit(1)

    const year = current
      ?? (await db
          .select()
          .from(academicYears)
          .where(sql`${academicYears.schoolId} = ${schoolId} and ${academicYears.isActive} = true`)
          .orderBy(sql`${academicYears.startDate} desc`)
          .limit(1))[0]

    if (!year) return ok(null)

    const termRows = await db
      .select()
      .from(terms)
      .where(eq(terms.academicYearId, year.id))
      .orderBy(sql`${terms.termNumber} asc`)

    return ok({ ...year, terms: termRows })
  })(request)
}
