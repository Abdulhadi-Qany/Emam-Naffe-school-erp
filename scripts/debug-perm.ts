#!/usr/bin/env node
/**
 * Simulate requirePermission check for Abdul Hadi and academics:read.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const userId = 'zLqexFOi8PQcZhCnoRoSLT2wew3QhHoB' // Abdul Hadi
  const schoolId = 'emam-bukhari-private-school'
  const permission = 'academics:read'

  const { rows } = await pool.query(
    `SELECT role, permissions FROM staff_roles WHERE user_id = $1 AND school_id = $2`,
    [userId, schoolId]
  )

  console.log(`Found ${rows.length} rows`)

  let allowed = false
  for (const r of rows) {
    console.log(`\nChecking role: ${r.role}`)
    console.log(`Permissions: ${JSON.stringify(r.permissions)}`)
    console.log(`Type of permissions: ${typeof r.permissions}`)
    console.log(`Is array: ${Array.isArray(r.permissions)}`)

    if (Array.isArray(r.permissions)) {
      const hasStar = r.permissions.some((item) => item === '*')
      const hasExact = r.permissions.some((item) => item === permission)
      console.log(`Contains '*': ${hasStar}`)
      console.log(`Contains '${permission}': ${hasExact}`)
      if (hasStar || hasExact) {
        allowed = true
        console.log(`=> ALLOWED by this row`)
      } else {
        console.log(`=> DENIED by this row`)
      }
    } else {
      console.log(`Permissions is not an array`)
    }
  }

  console.log(`\nOverall allowed: ${allowed}`)
  if (!allowed) {
    console.log(`=> Would throw ForbiddenError`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
