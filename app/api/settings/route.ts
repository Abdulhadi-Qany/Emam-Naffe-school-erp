import { db } from '@/lib/db'
import { configSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, badRequest, withV1, audit } from '@/lib/api'

/**
 * Typed configuration surface for the ERP settings page.
 * Values are stored as JSON per key in `config_settings`; defaults are applied
 * on read so a fresh install returns a complete object.
 */

const DEFAULTS: Record<string, unknown> = {
  gradingSystem: 'Numeric (0-100)',
  currency: 'AFN',
  currencySymbol: '؋',
  lateFee: 50,
  defaultLanguage: 'Dari',
  dateFormat: 'Solar Hijri',
  timeFormat: '24-hour',
  timezone: 'Asia/Kabul',
  academicYearStartMonth: 3,
  enableSmsNotifications: false,
  enableEmailNotifications: true,
}

const NUMERIC_KEYS = ['lateFee', 'academicYearStartMonth'] as const
const BOOLEAN_KEYS = ['enableSmsNotifications', 'enableEmailNotifications'] as const

async function loadSettings(schoolId: string): Promise<Record<string, unknown>> {
  const rows = await db.select().from(configSettings).where(eq(configSettings.schoolId, schoolId))
  const merged: Record<string, unknown> = { ...DEFAULTS }
  for (const row of rows) merged[row.key] = row.value
  return merged
}

export const GET = withV1('settings:read', async ({ schoolId }) => {
  return ok({ settings: await loadSettings(schoolId) })
})

export const PUT = withV1('settings:write', async ({ user, schoolId }, request) => {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || key === 'settings') continue
    if (NUMERIC_KEYS.includes(key as (typeof NUMERIC_KEYS)[number])) {
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || parsed < 0) return badRequest(`${key} must be a non-negative number`)
      updates[key] = parsed
      continue
    }
    if (BOOLEAN_KEYS.includes(key as (typeof BOOLEAN_KEYS)[number])) {
      updates[key] = Boolean(value)
      continue
    }
    updates[key] = value
  }

  if (Object.keys(updates).length === 0) return badRequest('No settings provided')

  for (const [key, value] of Object.entries(updates)) {
    await db
      .insert(configSettings)
      .values({ id: crypto.randomUUID(), schoolId, key, value: value as never })
      .onConflictDoUpdate({
        target: [configSettings.schoolId, configSettings.key],
        set: { value: value as never, updatedAt: new Date() },
      })
  }

  await audit({
    schoolId,
    userId: user.id,
    action: 'updated',
    module: 'settings',
    entityType: 'config_settings',
    entityId: schoolId,
    changes: updates,
  })

  return ok({ settings: await loadSettings(schoolId), updated: Object.keys(updates) })
})
