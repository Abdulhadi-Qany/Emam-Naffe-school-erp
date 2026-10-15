#!/usr/bin/env node
/**
 * Check if a session token exists in the database.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  // The token we got from the successful PowerShell request
  const token = 'ZxRu0emhuajF9DIkCmHzQ6rLTOv0IKii.qr2hDSHI0EqrQwr8%2BZDKDa5G4Oud%2BKkFMld845ZlBUs%3D'

  const { rows } = await pool.query(
    `SELECT id, token, "userId", "expiresAt" FROM session WHERE token = $1`,
    [token]
  )

  if (rows.length === 0) {
    console.log(`No session found for token: ${token}`)
  } else {
    const s = rows[0]
    console.log(`Session found:`)
    console.log(`  id: ${s.id}`)
    console.log(`  token: ${s.token}`)
    console.log(`  userId: ${s.userId}`)
    console.log(`  expiresAt: ${s.expiresAt}`)
    // Check if expired
    const now = new Date()
    const expires = new Date(s.expiresAt)
    console.log(`  now: ${now}`)
    console.log(`  expires: ${expires}`)
    console.log(`  expired: ${expires < now}`)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
