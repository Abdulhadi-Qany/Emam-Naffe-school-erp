#!/usr/bin/env node
/**
 * Resets every auth user's password to a known dev value and
 * lists each user with their staff_roles.
 *
 * Usage: npx tsx --env-file=.env.local scripts/reset-all-passwords.ts [password]
 */
import { Pool } from 'pg'
import { hashPassword } from '@better-auth/utils/password'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const newPassword = process.argv[2] || 'Ebps-Dev-2026!'

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const passwordHash = await hashPassword(newPassword)

  const { rows: users } = await pool.query(
    `SELECT id, email, name FROM "user" ORDER BY "createdAt" ASC`
  )

  console.log(`Users: ${users.length}`)
  console.log(`Password for all: ${newPassword}`)
  console.log('')

  for (const u of users) {
    const { rowCount } = await pool.query(
      `UPDATE account SET password = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
      [passwordHash, u.id]
    )

    const { rows: roles } = await pool.query(
      `SELECT school_id, role, permissions FROM staff_roles WHERE user_id = $1`,
      [u.id]
    )

    const roleSummary = roles
      .map((r) => `${r.school_id}:${r.role}`)
      .join(', ') || '(no role)'

    console.log(`- ${u.name} <${u.email}>`)
    console.log(`    password: ${newPassword}  (updated ${rowCount})`)
    console.log(`    roles: ${roleSummary}`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
