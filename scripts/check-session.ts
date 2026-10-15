#!/usr/bin/env node
/**
 * Check if a session token exists in the database.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  // The token we got from the sign-in cookie (including the %3D)
  const token = 'fbcEW530BOVxMF0TJ8TfDXeqtkdGkNhj.ah5B9pdJjCeU%2BUuWiKPZm14GMnQtqi4Qrt4LBzME59c%3D'

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
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
