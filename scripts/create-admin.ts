#!/usr/bin/env node
/**
 * Create a new admin user with full permissions.
 * This script creates a user in Better Auth tables and assigns admin role.
 */
import { Pool } from 'pg'
import { randomBytes } from 'node:crypto'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ebps_erp'
const pool = new Pool({ connectionString })

async function main() {
  console.log('Creating admin user...')
  
  const email = process.env.ADMIN_EMAIL || 'admin@school.edu'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const name = process.env.ADMIN_NAME || 'School Administrator'
  const schoolId = process.env.SCHOOL_ID || 'emam-bukhari-private-school'
  
  console.log('Email:', email)
  console.log('Name:', name)
  console.log('School:', schoolId)
  
  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM "user" WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      console.log('User already exists with email:', email)
      const userId = existing.rows[0].id
      console.log('User ID:', userId)
      
      // Update existing user to ensure they have admin role
      await pool.query(
        `INSERT INTO staff_roles (id, school_id, user_id, role, permissions, created_at, updated_at)
         VALUES ($1, $2, $3, 'school_admin', $4, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [randomBytes(16).toString('hex'), schoolId, userId, JSON.stringify(['*'])]
      )
      console.log('User updated with admin role')
      await pool.end()
      return
    }
    
    // Generate IDs
    const userId = randomBytes(16).toString('hex')
    const profileId = randomBytes(16).toString('hex')
    const roleId = randomBytes(16).toString('hex')
    const hashedPassword = '$2b$12$LJ3m4ys3Lk0TSwHCnAqH0O8XQYQYQYQYQYQYQYQYQYQYQYQYQY' // Placeholder
    
    // Insert user
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, name, email, true, null]
    )
    console.log('✅ User created with ID:', userId)
    
    // Insert user profile
    await pool.query(
      `INSERT INTO user_profiles (id, user_id, user_type, first_name, family_name, full_name, nationality, created_at, updated_at)
       VALUES ($1, $2, 'staff', $3, $4, $5, 'Afghan', NOW(), NOW())`,
      [profileId, userId, name.split(' ')[0] || name, name.split(' ').slice(1).join(' ') || '', name]
    )
    console.log('✅ User profile created')
    
    // Insert account with password
    const accountId = randomBytes(16).toString('hex')
    await pool.query(
      `INSERT INTO account (id, account_id, provider_id, user_id, password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [accountId, accountId, userId, hashedPassword]
    )
    console.log('✅ Account created')
    
    // Insert staff role with wildcard permissions
    await pool.query(
      `INSERT INTO staff_roles (id, school_id, user_id, role, permissions, created_at, updated_at)
       VALUES ($1, $2, $3, 'school_admin', $4, NOW(), NOW())`,
      [roleId, schoolId, userId, JSON.stringify(['*'])]
    )
    console.log('✅ Admin role assigned')
    
    // Insert staff record
    const staffId = randomBytes(16).toString('hex')
    await pool.query(
      `INSERT INTO staff (id, school_id, user_id, staff_id, employee_code, first_name, family_name, full_name, gender, join_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'male', NOW(), 'active', NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [staffId, schoolId, userId, `STAFF-${Date.now()}`, `EMP-${Date.now()}`, name.split(' ')[0] || name, name.split(' ').slice(1).join(' ') || '', name]
    )
    console.log('✅ Staff record created')
    
    console.log('\n🎉 Admin user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('User ID:', userId)
    console.log('Role: school_admin')
    console.log('Permissions: ["*"] (full access)')
    
    await pool.end()
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    await pool.end()
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Script failed:', e)
  process.exit(1)
})