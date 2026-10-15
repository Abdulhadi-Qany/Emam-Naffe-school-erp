#!/usr/bin/env node
/**
 * Update the most recent session token to be URL-encoded so it matches the cookie value.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  // Get the most recent session for Abdul Hadi
  const { rows: sessions } = await pool.query(
    `SELECT id, token FROM session WHERE "userId" = (SELECT id FROM "user" WHERE email = 'abdulhadi.qany19@gmail.com') ORDER BY "createdAt" DESC LIMIT 1`
  )
  if (sessions.length === 0) {
    console.log(`No session found for user`)
    return
  }
  const session = sessions[0]
  const rawToken = session.token
  console.log(`Current token: ${rawToken}`)
  // URL-encode the token
  const encodedToken = encodeURIComponent(rawToken)
  console.log(`URL-encoded token: ${encodedToken}`)
  // Update the session
  const { rowCount } = await pool.query(
    `UPDATE session SET token = $1 WHERE id = $2`,
    [encodedToken, session.id]
  )
  console.log(`Updated ${rowCount} row(s)`)
  // Verify
  const { rows: updated } = await pool.query(
    `SELECT token FROM session WHERE id = $1`,
    [session.id]
  )
  if (updated.length > 0) {
    console.log(`New token: ${updated[0].token}`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
