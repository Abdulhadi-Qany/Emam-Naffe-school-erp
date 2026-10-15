#!/usr/bin/env node
/**
 * Compare cookie token and database token.
 */
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  // The token we got from the cookie (URL-encoded)
  const cookieToken = 'ZxRu0emhuajF9DIkCmHzQ6rLTOv0IKii.qr2hDSHI0EqrQwr8%2BZDKDa5G4Oud%2BKkFMld845ZlBUs%3D'
  // Decode the token: replace URL-encoded characters
  let decodedToken = decodeURIComponent(cookieToken)
  // Remove any trailing '=' (base64 padding)
  decodedToken = decodedToken.replace(/=+$/, '')
  console.log(`Cookie token: ${cookieToken}`)
  console.log(`Decoded token: ${decodedToken}`)

  // Get the most recent session for the user
  const { rows: sessions } = await pool.query(
    `SELECT token FROM session WHERE "userId" = (SELECT id FROM "user" WHERE email = 'abdulhadi.qany19@gmail.com') AND "schoolId" = (SELECT id FROM schools WHERE name = 'emam-bukhari-private-school') ORDER BY "createdAt" DESC LIMIT 1`
  )
  if (sessions.length === 0) {
    console.log(`No session found for user`)
    return
  }
  const dbToken = sessions[0].token
  console.log(`Database token: ${dbToken}`)

  console.log(`Tokens equal: ${decodedToken === dbToken}`)
  if (decodedToken !== dbToken) {
    console.log(`Length cookie: ${decodedToken.length}`)
    console.log(`Length db: ${dbToken.length}`)
    for (let i = 0; i < Math.max(decodedToken.length, dbToken.length); i++) {
      if (decodedToken[i] !== dbToken[i]) {
        console.log(`Mismatch at index ${i}: cookie='${decodedToken[i]}' db='${dbToken[i]}'`)
        break
      }
    }
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
