#!/usr/bin/env node
/**
 * Create admin user with proper bcrypt password hash
 */
import { Pool } from 'pg'
import { randomBytes } from 'node:crypto'
import * as bcrypt from 'bcrypt'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ebps_erp'
const pool = new Pool({ connectionString })

async function main() {
  console.log('Creating admin user with bcrypt password...')
  
  const email = process.env.ADMIN_EMAIL || 'admin@school.edu'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const name = process.env.ADMIN_NAME || 'School Administrator'
  const schoolId = process.env.SCHOOL_ID || 'emam-bukhari-private-school'
  
  console.log('Email:', email)
  console.log('Name:', name)
  
  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM "user" WHERE email = $1', [email])
    let userId: string
    
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id
      console.log('User already exists, updating password...')
      
      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, 12)
      await pool.query(
        `UPDATE account SET password = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
        [hashedPassword, userId]
      )
      console.log('Password updated')
    } else {
      userId = randomBytes(16).toString('hex')
      const profileId = randomBytes(16).toString('hex')
      const accountId = randomBytes(16).toString('hex')
      const roleId = randomBytes(16).toString('hex')
      const staffId = randomBytes(16).toString('hex')
      
      // Insert user
      await pool.query(
        `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [userId, name, email, true, null]
      )
      console.log('✅ User created')
      
      // Insert user profile
      await pool.query(
        `INSERT INTO user_profiles (id, user_id, user_type, first_name, family_name, full_name, nationality, created_at, updated_at)
         VALUES ($1, $2, 'staff', $3, $4, $5, 'Afghan', NOW(), NOW())`,
        [profileId, userId, name.split(' ')[0] || name, name.split(' ').slice(1).join(' ') || '', name]
      )
      console.log('✅ User profile created')
      
      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, 12)
      
      // Insert account with hashed password
      await pool.query(
        `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
        [accountId, accountId, userId, hashedPassword]
      )
      console.log('✅ Account created')
      
      // Insert staff role
      await pool.query(
        `INSERT INTO staff_roles (id, school_id, user_id, role, permissions, created_at, updated_at)
         VALUES ($1, $2, $3, 'school_admin', $4, NOW(), NOW())`,
        [roleId, schoolId, userId, JSON.stringify(['*'])]
      )
      console.log('✅ Admin role assigned')
      
      // Insert staff record
      await pool.query(
        `INSERT INTO staff (id, school_id, user_id, staff_id, employee_code, first_name, family_name, full_name, gender, join_date, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'male', NOW(), 'active', NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [staffId, schoolId, userId, `STAFF-${Date.now()}`, `EMP-${Date.now()}`, name.split(' ')[0] || name, name.split(' ').slice(1).join(' ') || '', name]
      )
      console.log('✅ Staff record created')
    }
    
    console.log('\n🎉 Admin user ready!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('User ID:', userId)
    console.log('Role: school_admin')
    console.log('Permissions: ["*"] (full access)')
    
    await pool.end()
  } catch (error) {
    console.error('❌ Error:', error)
    await pool.end()
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Script failed:', e)
  process.exit(1)
})