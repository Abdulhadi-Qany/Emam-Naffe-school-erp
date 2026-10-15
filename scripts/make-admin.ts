#!/usr/bin/env node
/**
 * Check and make admin10@gmail.com an admin user
 */
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'node:crypto'

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ebps_erp' })

async function main() {
  const email = 'admin10@gmail.com'
  const password = 'Qany@12345'
  const name = 'Admin User'
  const schoolId = 'emam-bukhari-private-school'
  
  console.log('Checking user:', email)
  
  try {
    // Check if user exists
    const userResult = await pool.query('SELECT id FROM "user" WHERE email = $1', [email])
    
    if (userResult.rows.length === 0) {
      console.log('User does not exist, creating...')
      
      const userId = randomBytes(16).toString('hex')
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
        [profileId, userId, name.split(' ')[0], name.split(' ').slice(1).join(' ') || '', name]
      )
      console.log('✅ User profile created')
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)
      
      // Insert account
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
        [staffId, schoolId, userId, `STAFF-${Date.now()}`, `EMP-${Date.now()}`, name.split(' ')[0], name.split(' ').slice(1).join(' ') || '', name]
      )
      console.log('✅ Staff record created')
      
      console.log('\n🎉 Admin user created successfully!')
      console.log('Email:', email)
      console.log('Password:', password)
      console.log('User ID:', userId)
      console.log('Role: school_admin')
      console.log('Permissions: ["*"] (full access)')
    } else {
      const userId = userResult.rows[0].id
      console.log('User exists, checking role...')
      
      // Check if already admin
      const roleResult = await pool.query(
        'SELECT * FROM staff_roles WHERE user_id = $1 AND school_id = $2',
        [userId, schoolId]
      )
      
      if (roleResult.rows.length === 0) {
        // Assign admin role
        const roleId = randomBytes(16).toString('hex')
        await pool.query(
          `INSERT INTO staff_roles (id, school_id, user_id, role, permissions, created_at, updated_at)
           VALUES ($1, $2, $3, 'school_admin', $4, NOW(), NOW())`,
          [roleId, schoolId, userId, JSON.stringify(['*'])]
        )
        console.log('✅ Admin role assigned')
      } else {
        console.log('User already has role:', roleResult.rows[0].role)
      }
      
      console.log('\n🎉 User is now an admin!')
      console.log('Email:', email)
      console.log('User ID:', userId)
    }
    
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