#!/usr/bin/env node
/**
 * Fix all session tokens to match Better Auth cookie format (URL-encoded).
 * This script updates the session table to store URL-encoded tokens.
 */
import { Pool } from 'pg'

// Use hardcoded database URL or environment variable
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ebps_erp'

const pool = new Pool({ connectionString })

async function main() {
  console.log('Starting session token encoding fix...')
  console.log('Database:', connectionString.replace(/:[^:]*@/, ':***@')) // Hide password
  
  try {
    // Get all sessions
    const { rows: sessions } = await pool.query(
      'SELECT id, token FROM session WHERE token IS NOT NULL AND token != \'\''
    )
    
    if (sessions.length === 0) {
      console.log('No sessions found to fix')
      await pool.end()
      return
    }
    
    console.log(`Found ${sessions.length} sessions to process`)
    
    let updatedCount = 0
    let errorCount = 0
    
    for (const session of sessions) {
      try {
        const currentToken = session.token
        const isAlreadyEncoded = currentToken.includes('%25') || currentToken.includes('%2B') || currentToken.includes('%2F') || currentToken.includes('%3D')
        
        if (isAlreadyEncoded) {
          console.log('Token ' + session.id.substring(0, 8) + '... is already URL-encoded, skipping')
          continue
        }
        
        console.log('Encoding token ' + session.id.substring(0, 8) + '... (length: ' + currentToken.length + ')')
        
        // URL-encode the token
        const encodedToken = encodeURIComponent(currentToken)
        
        // Update the session
        const { rowCount } = await pool.query(
          'UPDATE session SET token = $1 WHERE id = $2',
          [encodedToken, session.id]
        )
        
        if (rowCount > 0) {
          updatedCount++
          console.log('\u2705 Updated token ' + session.id.substring(0, 8) + '...')
        } else {
          errorCount++
          console.log('\u274c Failed to update token ' + session.id.substring(0, 8) + '...')
        }
        
      } catch (error) {
        errorCount++
        console.error('\u274c Error encoding token ' + session.id.substring(0, 8) + '...: ', error)
      }
    }
    
    console.log('\nFix completed!')
    console.log('Total sessions processed: ' + sessions.length)
    console.log('Successfully updated: ' + updatedCount)
    console.log('Errors: ' + errorCount)

    await pool.end()
  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Script failed:', e)
  process.exit(1)
})