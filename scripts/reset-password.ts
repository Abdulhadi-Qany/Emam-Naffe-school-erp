#!/usr/bin/env node
/**
 * Resets a user's password to a known value using better-auth's own
 * scrypt hasher, so the resulting hash is fully compatible with the
 * sign-in flow. Dev-only helper.
 *
 * Usage: npx tsx --env-file=.env.local scripts/reset-password.ts [email] [newPassword]
 */
import { Pool } from 'pg'
import { hashPassword } from '@better-auth/utils/password'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const email = process.argv[2] || 'abdulhadi.qany19@gmail.com'
  const newPassword = process.argv[3] || 'Ebps-Dev-2026!'

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const { rows: users } = await pool.query(
    `SELECT id, email, name FROM "user" WHERE email = $1`,
    [email]
  )
  if (users.length === 0) {
    throw new Error(`No user with email ${email}`)
  }
  const user = users[0]

  const passwordHash = await hashPassword(newPassword)

  const { rowCount } = await pool.query(
    `UPDATE account SET password = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
    [passwordHash, user.id]
  )

  console.log('Password reset complete.')
  console.log(`  Name:  ${user.name}`)
  console.log(`  Email: ${user.email}`)
  console.log(`  Password: ${newPassword}`)
  console.log(`  Account rows updated: ${rowCount}`)

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
