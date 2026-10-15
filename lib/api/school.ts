import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { schools } from '@/lib/db/schema'

/** Fallback school identifier used when no school row exists yet (fresh installs). */
export const DEFAULT_SCHOOL_ID = 'emam-bukhari-private-school'

/**
 * Resolve the school a payroll/finance request belongs to.
 * Priority: explicit request value -> first configured school -> bootstrap default.
 */
export async function resolveSchoolId(requested?: string | null): Promise<string> {
  const candidate = requested?.trim()
  if (candidate) return candidate

  const [school] = await db
    .select({ id: schools.id })
    .from(schools)
    .orderBy(desc(schools.createdAt))
    .limit(1)

  return school?.id ?? DEFAULT_SCHOOL_ID
}
