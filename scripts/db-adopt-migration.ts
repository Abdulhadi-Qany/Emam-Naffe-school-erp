#!/usr/bin/env node
/**
 * Adoption script for pre-existing databases.
 *
 * `drizzle/0000_init.sql` describes the complete schema, but the dev database
 * was created with `drizzle-kit push` before migrations existed. This script:
 *
 *  1. Creates drizzle's migration journal table (`drizzle.__drizzle_migrations`)
 *     with the exact DDL drizzle-kit uses.
 *  2. Executes only the statements that create the NEW objects (the schema
 *     additions from the backend completeness plan), skipping objects that
 *     already exist, so the script is safe to re-run.
 *  3. Records `0000_init` in the journal (hash = sha256 of the SQL file,
 *     created_at = journal `when`) so future `drizzle-kit migrate` runs treat
 *     the baseline as applied and only apply newer migrations.
 *
 * Run once: `npm run db:adopt`
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { Pool } from 'pg'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const NEW_ENUMS = [
  'facility_work_order_status',
  'procurement_request_status',
  'compliance_record_status',
  'inspection_status',
  'incident_severity',
  'incident_status',
  'wellbeing_referral_status',
  'cafeteria_meal_type',
  'volunteer_status',
  'donation_status',
  'invitation_status',
  'document_instance_status',
]

const NEW_TABLES = [
  'number_sequences',
  'facility_work_orders',
  'facility_bookings',
  'utility_bills',
  'procurement_vendors',
  'procurement_requests',
  'purchase_orders',
  'purchase_order_items',
  'compliance_policies',
  'compliance_inspections',
  'compliance_action_plans',
  'data_processing_records',
  'security_incidents',
  'wellbeing_referrals',
  'wellbeing_checkins',
  'cafeteria_menus',
  'cafeteria_meal_subscriptions',
  'community_volunteers',
  'community_donations',
  'system_backups',
  'notification_preferences',
  'portal_invitations',
  'document_templates',
  'document_instances',
]

const NEW_OBJECTS = new Set([...NEW_ENUMS, ...NEW_TABLES])

/** Extracts the primary object name a DDL statement operates on. */
function statementObject(statement: string): string | null {
  const createType = statement.match(/CREATE TYPE\s+"?public"?\."([\w]+)"/i)
  if (createType) return createType[1]
  const createTable = statement.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"([\w]+)"/i)
  if (createTable) return createTable[1]
  const createIndex = statement.match(/CREATE (?:UNIQUE )?INDEX(?:\s+IF NOT EXISTS)?\s+"?([\w]+)"?\s+ON\s+"([\w]+)"/i)
  if (createIndex) return createIndex[2]
  const alterTable = statement.match(/ALTER TABLE\s+"([\w]+)"/i)
  if (alterTable) return alterTable[1]
  return null
}

async function exists(pool: Pool, kind: 'type' | 'table' | 'index' | 'constraint', name: string, schema = 'public'): Promise<boolean> {
  if (kind === 'type') {
    const { rows } = await pool.query(
      'select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = $1 and n.nspname = $2',
      [name, schema]
    )
    return rows.length > 0
  }
  if (kind === 'table') {
    const { rows } = await pool.query('select to_regclass($1) is not null as exists', [`${schema}.${name}`])
    return rows[0]?.exists === true
  }
  if (kind === 'index') {
    const { rows } = await pool.query(
      'select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname = $1 and n.nspname = $2',
      [name, schema]
    )
    return rows.length > 0
  }
  const { rows } = await pool.query('select 1 from pg_constraint where conname = $1', [name])
  return rows.length > 0
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required')

  const migrationFolder = join(root, 'drizzle')
  const migrationFile = join(migrationFolder, '0000_init.sql')
  const journalFile = join(migrationFolder, 'meta', '_journal.json')
  if (!existsSync(migrationFile) || !existsSync(journalFile)) {
    throw new Error('drizzle/0000_init.sql and drizzle/meta/_journal.json must exist (run `npx drizzle-kit generate`)')
  }

  const journal = JSON.parse(readFileSync(journalFile, 'utf8')) as {
    entries: { tag: string; when: number }[]
  }
  const entry = journal.entries[0]
  const sql = readFileSync(migrationFile, 'utf8')
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const pool = new Pool({ connectionString, max: 1 })

  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS "drizzle"')
    await pool.query(
      'CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)'
    )

    const target = statements.filter((statement) => {
      const object = statementObject(statement)
      return object !== null && NEW_OBJECTS.has(object)
    })

    let applied = 0
    let skipped = 0
    for (const statement of target) {
      const object = statementObject(statement) as string
      if (/^CREATE TYPE/i.test(statement)) {
        if (await exists(pool, 'type', object)) { skipped += 1; continue }
      } else if (/^CREATE TABLE/i.test(statement)) {
        if (await exists(pool, 'table', object)) { skipped += 1; continue }
      } else if (/^CREATE (UNIQUE )?INDEX/i.test(statement)) {
        const indexName = statement.match(/CREATE (?:UNIQUE )?INDEX(?:\s+IF NOT EXISTS)?\s+"?([\w]+)"?/i)?.[1]
        if (indexName && (await exists(pool, 'index', indexName))) { skipped += 1; continue }
      } else if (/^ALTER TABLE/i.test(statement)) {
        const constraintName = statement.match(/ADD CONSTRAINT\s+"([\w]+)"/i)?.[1]
        if (constraintName && (await exists(pool, 'constraint', constraintName))) { skipped += 1; continue }
      }
      await pool.query(statement)
      applied += 1
    }

    const hash = createHash('sha256').update(sql).digest('hex')
    const existing = await pool.query(
      'select 1 from "drizzle"."__drizzle_migrations" where hash = $1',
      [hash]
    )
    if (existing.rows.length === 0) {
      await pool.query(
        'insert into "drizzle"."__drizzle_migrations" ("hash", "created_at") values ($1, $2)',
        [hash, entry?.when ?? 0]
      )
    }

    console.log(
      `Adopted ${entry?.tag ?? 'migration'}: ${applied} statements applied, ${skipped} already present, journal recorded`
    )
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Migration adoption failed:', error)
  process.exit(1)
})
