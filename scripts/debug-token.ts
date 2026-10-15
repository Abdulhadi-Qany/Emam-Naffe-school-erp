#!/usr/bin/env node
/**
 * Debug the session token.
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
  console.log(`Length: ${rawToken.length}`)
  console.log(`Contains '+': ${rawToken.includes('+')}`)
  console.log(`Contains '=': ${rawToken.includes('=')}`)
  // URL-encode the token
  const encodedToken = encodeURIComponent(rawToken)
  console.log(`URL-encoded token: ${encodedToken}`)
  console.log(`Length encoded: ${encodedToken.length}`)

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
