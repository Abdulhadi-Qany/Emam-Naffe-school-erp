import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Client, Pool } from 'pg'

/**
 * Minimal `.env.local` parser (KEY=VALUE, optional surrounding quotes).
 * Tests run via `tsx --test` without `--env-file`, so live-DB tests load it here.
 */
export function loadEnvLocal(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    const out: Record<string, string> = {}
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
      if (!match) continue
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      out[match[1]] = value
    }
    return out
  } catch {
    return {}
  }
}

const envLocal = loadEnvLocal()

// Side effect: populate process.env BEFORE lib/db and lib/auth initialize.
// Live-DB tests must import this module first (ESM/CJS evaluation order both
// preserve import-declaration order).
process.env.DATABASE_URL ||= envLocal.DATABASE_URL
process.env.BETTER_AUTH_SECRET ||= envLocal.BETTER_AUTH_SECRET || 'live-db-test-secret-000000000000000'
process.env.BETTER_AUTH_URL ||= envLocal.BETTER_AUTH_URL || 'http://localhost:3000'

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured (expected in .env.local)')
  return url
}

/** Deterministic fixtures for the live-DB e2e suite. */
export const LIVE_SCHOOL_ID = 'e2e-live-student-school'
export const ADMIN_EMAIL = 'e2e-live-admin@test.local'
export const VIEWER_EMAIL = 'e2e-live-viewer@test.local'
export const E2E_PASSWORD = 'E2e-Live-Passw0rd!'

/**
 * Idempotent DDL required by the student module, mirroring `lib/db/schema.ts`.
 * Safe to run repeatedly; catches "already exists" on older Postgres versions.
 */
export async function ensureLiveDbSchema(client: Client | Pool): Promise<void> {
  const statements: string[] = [
    // students.father_mobile — father's phone is part of the admission aggregate
    `ALTER TABLE students ADD COLUMN IF NOT EXISTS father_mobile text`,
    // student_guardians — guardian contact details written by toGuardianRow()
    `ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS name text`,
    `ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS mobile text`,
    `ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS phone text`,
    `ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS email text`,
    `ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS occupation text`,
    `ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS tazkira_number text`,
    `ALTER TABLE student_guardians ADD COLUMN IF NOT EXISTS national_id text`,
    // student_documents.status — verification state written by toDocumentRow()
    `ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'`,
    // RBAC table read/written by requirePermission() (schema.ts staffRoles)
    `CREATE TABLE IF NOT EXISTS staff_roles (
      id text PRIMARY KEY,
      school_id text NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      user_id text REFERENCES "user"(id) ON DELETE CASCADE,
      staff_id text REFERENCES staff(id) ON DELETE CASCADE,
      role text NOT NULL,
      permissions jsonb NOT NULL DEFAULT '[]',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS staff_roles_school_id_idx ON staff_roles(school_id)`,
    `CREATE INDEX IF NOT EXISTS staff_roles_user_id_idx ON staff_roles(user_id)`,
  ]
  for (const sql of statements) {
    await client.query(sql)
  }

  // Domain statuses must exist on the shared `status` enum (additive, PG9.6+ IF NOT EXISTS).
  for (const value of ['graduated', 'transferred', 'dropped_out']) {
    try {
      await client.query(`ALTER TYPE status ADD VALUE IF NOT EXISTS '${value}'`)
    } catch {
      // Value already present on PostgreSQL versions without IF NOT EXISTS.
    }
  }
}
