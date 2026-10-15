#!/usr/bin/env node
/**
 * Inspects the better-auth `account` table for a given email.
 * Run with: npx tsx --env-file=.env.local scripts/inspect-account.ts <email>
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const email = process.argv[2] || 'abdulhadi.qany19@gmail.com'

async function main() {
  const { rows: users } = await pool.query(
    `SELECT id, email, name FROM "user" WHERE email = $1`,
    [email]
  )
  if (users.length === 0) {
    console.log(`No user with email ${email}`)
    await pool.end()
    return
  }
  const user = users[0]
  console.log(`User: id=${user.id} email=${user.email} name=${user.name}`)

  const { rows: accounts } = await pool.query(
    `SELECT * FROM account WHERE "userId" = $1`,
    [user.id]
  )
  console.log(`Accounts: ${accounts.length}`)
  for (const a of accounts) {
    console.log(`  provider_id=${a.providerId} account_id=${a.accountId} has_password=${Boolean(a.password)}`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
