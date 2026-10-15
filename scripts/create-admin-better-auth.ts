#!/usr/bin/env node
/**
 * Create admin user using Better Auth API
 */
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/node-postgres'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db as appDb } from '@/lib/db'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ebps_erp' })

async function main() {
  console.log('Creating admin user via Better Auth...')
  
  const email = process.env.ADMIN_EMAIL || 'admin@school.edu'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const name = process.env.ADMIN_NAME || 'School Administrator'
  const schoolId = process.env.SCHOOL_ID || 'emam-bukhari-private-school'
  
  console.log('Email:', email)
  console.log('Name:', name)
  
  try {
    // Initialize Better Auth
    const auth = betterAuth({
      database: drizzleAdapter(appDb, { provider: 'pg', usePlural: false }),
      emailAndPassword: { enabled: true },
    })
    
    // Sign up user
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: new Headers(),
    })
    
    console.log('✅ User signed up successfully')
    console.log('User ID:', result.user.id)
    
    // Assign admin role
    await pool.query(
      `INSERT INTO staff_roles (id, school_id, user_id, role, permissions, created_at, updated_at)
       VALUES ($1, $2, $3, 'school_admin', $4, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [require('node:crypto').randomBytes(16).toString('hex'), schoolId, result.user.id, JSON.stringify(['*'])]
    )
    console.log('✅ Admin role assigned')
    
    // Create user profile
    await pool.query(
      `INSERT INTO user_profiles (id, user_id, user_type, first_name, family_name, full_name, nationality, created_at, updated_at)
       VALUES ($1, $2, 'staff', $3, $4, $5, 'Afghan', NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [require('node:crypto').randomBytes(16).toString('hex'), result.user.id, name.split(' ')[0] || name, name.split(' ').slice(1).join(' ') || '', name]
    )
    console.log('✅ User profile created')
    
    // Create staff record
    await pool.query(
      `INSERT INTO staff (id, school_id, user_id, staff_id, employee_code, first_name, family_name, full_name, gender, join_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'male', NOW(), 'active', NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [require('node:crypto').randomBytes(16).toString('hex'), schoolId, result.user.id, `STAFF-${Date.now()}`, `EMP-${Date.now()}`, name.split(' ')[0] || name, name.split(' ').slice(1).join(' ') || '', name]
    )
    console.log('✅ Staff record created')
    
    console.log('\n🎉 Admin user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('User ID:', result.user.id)
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