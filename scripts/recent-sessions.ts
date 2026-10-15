#!/usr/bin/env node
/**
 * Get the most recent sessions.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const { rows } = await pool.query(
    `SELECT id, token, "userId", "expiresAt" FROM session ORDER BY "createdAt" DESC LIMIT 5`
  )
  console.log(`Most recent 5 sessions:`)
  for (const r of rows) {
    console.log(`  id: ${r.id}`)
    console.log(`  token: ${r.token}`)
    console.log(`  userId: ${r.userId}`)
    console.log(`  expiresAt: ${r.expiresAt}`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
