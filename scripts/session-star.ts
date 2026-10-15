#!/usr/bin/env node
/**
 * Select * from session and see the keys.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const { rows } = await pool.query(
    `SELECT * FROM session LIMIT 1`
  )
  if (rows.length === 0) {
    console.log(`No rows in session table`)
  } else {
    const row = rows[0]
    console.log(`Columns in row:`)
    for (const key in row) {
      console.log(`  ${key}: ${row[key]}`)
    }
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
