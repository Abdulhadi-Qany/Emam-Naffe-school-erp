#!/usr/bin/env node
/**
 * Applies a specific migration file by tag and records it in drizzle's journal.
 * Used when `drizzle-kit migrate` cannot complete in this environment.
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Pool } from 'pg'

const tag = process.argv[2] ?? '0002_user_fk_fix'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationFolder = join(root, 'drizzle')

async function main(): Promise<void> {
  const journal = JSON.parse(readFileSync(join(migrationFolder, 'meta', '_journal.json'), 'utf8')) as {
    entries: { tag: string; when: number }[]
  }
  const entry = journal.entries.find((item) => item.tag === tag)
  if (!entry) throw new Error(`migration ${tag} not found in journal`)

  const sqlText = readFileSync(join(migrationFolder, `${tag}.sql`), 'utf8')

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS "drizzle"')
    await pool.query(
      'CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)'
    )

    const existing = await pool.query(
      'select 1 from "drizzle"."__drizzle_migrations" where created_at = $1',
      [entry.when]
    )
    if (existing.rows.length > 0) {
      console.log(`${tag} already recorded`)
      return
    }

    let skipped = 0
    let appliedStatements = 0
    for (const statement of sqlText.split('--> statement-breakpoint')) {
      const trimmed = statement.trim()
      if (trimmed.length === 0) continue
      try {
        await pool.query(trimmed)
        appliedStatements += 1
      } catch (error) {
        const code = (error as { code?: string }).code
        const message = (error as Error).message ?? ''
        const isAlter = /^ALTER TABLE/is.test(trimmed)
        const missingRelation = code === '42703' || code === '42704' || /does not exist/i.test(message)
        const duplicate = code === '42710'
        if (isAlter && (missingRelation || duplicate)) {
          skipped += 1
          continue
        }
        throw error
      }
    }

    const hash = createHash('sha256').update(sqlText).digest('hex')
    await pool.query('insert into "drizzle"."__drizzle_migrations" ("hash", "created_at") values ($1, $2)', [
      hash,
      entry.when,
    ])
    console.log(`Applied ${tag}: ${appliedStatements} statements (${skipped} skipped), journal recorded`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Apply failed:', error)
  process.exit(1)
})
