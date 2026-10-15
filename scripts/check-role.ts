#!/usr/bin/env node
/**
 * Check the staff_roles for a given user and school.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const userId = 'zLqexFOi8PQcZhCnoRoSLT2wew3QhHoB' // Abdul Hadi
  const schoolId = 'emam-bukhari-private-school'

  const { rows } = await pool.query(
    `SELECT role, permissions FROM staff_roles WHERE user_id = $1 AND school_id = $2`,
    [userId, schoolId]
  )

  console.log(`Found ${rows.length} rows for user ${userId} and school ${schoolId}`)
  for (const r of rows) {
    console.log(`  role: ${r.role}`)
    console.log(`  permissions: ${JSON.stringify(r.permissions)}`)
    console.log(`  type of permissions: ${typeof r.permissions}`)
    if (Array.isArray(r.permissions)) {
      console.log(`  is array: true, length: ${r.permissions.length}`)
      console.log(`  contents: ${r.permissions.map((p, i) => `[${i}] ${p}`).join(', ')}`)
    } else {
      console.log(`  is array: false`)
    }
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
