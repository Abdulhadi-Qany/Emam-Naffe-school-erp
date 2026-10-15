#!/usr/bin/env node
/**
 * Lists existing auth users and their staff_roles.
 * Run with: npx tsx --env-file=.env.local/scripts/list-users.ts
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const { rows: users } = await pool.query(
    `SELECT id, email, name, "emailVerified", "createdAt" FROM "user" ORDER BY "createdAt" ASC`
  )
  console.log(`Users: ${users.length}`)
  for (const u of users) {
    console.log(`  id=${u.id} email=${u.email} name=${u.name} verified=${u.emailVerified}`)
  }

  const { rows: roles } = await pool.query(
    `SELECT school_id, user_id, role, permissions FROM staff_roles ORDER BY created_at ASC`
  )
  console.log(`\nStaff roles: ${roles.length}`)
  for (const r of roles) {
    console.log(`  school=${r.school_id} user=${r.user_id} role=${r.role} permissions=${JSON.stringify(r.permissions)}`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
