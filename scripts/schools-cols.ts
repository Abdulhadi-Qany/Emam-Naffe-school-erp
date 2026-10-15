#!/usr/bin/env node
/**
 * List column names of the schools table.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const { rows } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'schools' ORDER BY ordinal_position`
  )

  console.log(`Columns in schools table:`)
  for (const r of rows) {
    console.log(`  ${r.column_name}: ${r.data_type}`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
