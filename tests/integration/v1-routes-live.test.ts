import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
// MUST be first: populates process.env (DATABASE_URL, BETTER_AUTH_*) before lib/* modules initialize.
import {
  ensureLiveDbSchema,
  E2E_PASSWORD,
} from '../helpers/live-db'

/** Distinct admin email (the v2 suite deletes the shared ADMIN_EMAIL on cleanup). */
const V1_ADMIN_EMAIL = 'e2e-v1-admin@test.local'
/** Isolated school for this suite (keeps the seeded school untouched). */
const TEST_SCHOOL_ID = 'e2e-v1-school'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { withAuth } from '@/src/infrastructure/http/middleware'
import * as departmentsRoute from '@/app/api/departments/route'
import * as departmentRoute from '@/app/api/departments/[id]/route'
import * as gradesRoute from '@/app/api/academic/grades/route'
import * as gradesItemRoute from '@/app/api/academic/grades/[id]/route'
import * as settingsRoute from '@/app/api/settings/route'

/**
 * Live end-to-end verification of the v1 API lane: unauthenticated requests
 * are rejected, an authenticated school-scoped user can exercise the full
 * CRUD lifecycle, and enrichment endpoints return the documented envelopes.
 */

let adminToken = ''
const createdIds: string[] = []
let createdDepartmentId = ''
let createdGradeId = ''

const BASE = 'http://localhost:3000/api'

function signedSessionCookie(token: string): string {
  const secret = process.env.BETTER_AUTH_SECRET
  assert.ok(secret, 'BETTER_AUTH_SECRET must be configured')
  const signature = createHmac('sha256', secret).update(token).digest('base64')
  return `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`
}

async function signUpAndSignIn(email: string, name: string): Promise<{ token: string; userId: string }> {
  let token = ''
  let userId = ''
  try {
    const signUp = (await auth.api.signUpEmail({
      body: { email, password: E2E_PASSWORD, name },
      headers: new Headers(),
    })) as { token?: string; user?: { id: string } }
    token = signUp.token ?? ''
    userId = signUp.user?.id ?? ''
  } catch {
    // User already exists from a previous run â€” sign in instead.
    const signIn = (await auth.api.signInEmail({
      body: { email, password: E2E_PASSWORD },
      headers: new Headers(),
    })) as { token?: string; user?: { id: string } }
    token = signIn.token ?? ''
    userId = signIn.user?.id ?? ''
  }

  assert.ok(token, `a session token must be available for ${email}`)
  return { token, userId }
}

function request(
  token: string | null,
  init: { method?: string; url?: string; body?: unknown } = {}
): NextRequest {
  const headers: Record<string, string> = { 'x-school-id': TEST_SCHOOL_ID }
  if (token) headers.cookie = signedSessionCookie(token)
  if (init.body !== undefined) headers['content-type'] = 'application/json'
  return new NextRequest(init.url ?? BASE, {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })

before(async () => {
  await ensureLiveDbSchema(pool)

  // The isolated test school must exist before the admin bootstrap fires.
  await pool
    .query(
      `insert into schools (id, name, name_dari, name_pashto, email, phone, address, city, province, country, timezone, currency, academic_year_start_month, website, status)
       values ($1, 'V1 Live Test School', 'Ù…Ú©ØªØ¨ ØªØ³Øª', 'Ø¯ Ø§Ø²Ù…ÙˆÛŒÙ†Û Ù…Ú©ØªØ¨', 'v1@test.local', '+93-000-000-0000', 'Kabul', 'Kabul', 'Kabul', 'Afghanistan', 'Asia/Kabul', 'AFN', 3, 'v1.test', 'active')
       on conflict (id) do nothing`,
      [TEST_SCHOOL_ID]
    )

  const admin = await signUpAndSignIn(V1_ADMIN_EMAIL, 'V1 Admin')
  adminToken = admin.token

  // The first user of a school is bootstrapped as school_admin on first use.
  const warmup = await withAuth(
    async () => NextResponse.json({ ok: true }),
    { requireAll: ['settings:read'] }
  )(request(adminToken, { url: `${BASE}/settings` }), { params: Promise.resolve({}) })
  assert.equal(warmup.status, 200)
})

test('v1: unauthenticated requests are rejected with 401', async () => {
  const response = await gradesRoute.GET(request(null, { url: `${BASE}/academic/grades` }))
  assert.equal(response.status, 401)
})

test('v1: authenticated list returns the { data, pagination } envelope', async () => {
  const response = await gradesRoute.GET(request(adminToken, { url: `${BASE}/academic/grades?page=1&limit=5` }))
  assert.equal(response.status, 200)
  const body = (await response.json()) as {
    data: unknown[]
    pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean }
  }
  assert.ok(Array.isArray(body.data))
  assert.equal(body.pagination.page, 1)
  assert.equal(body.pagination.limit, 5)
  assert.ok(body.pagination.total >= 0)

  // A create makes the list return the new row for this school.
  const created = await gradesRoute.POST(
    request(adminToken, { method: 'POST', url: `${BASE}/academic/grades`, body: { name: 'List Grade', level: 11 } })
  )
  assert.equal(created.status, 201)
  const grade = (await created.json()) as { id: string }
  createdIds.push(grade.id)

  const after = await gradesRoute.GET(request(adminToken, { url: `${BASE}/academic/grades?page=1&limit=5` }))
  const afterBody = (await after.json()) as { pagination: { total: number } }
  assert.equal(afterBody.pagination.total, 1)
})

test('v1: department lifecycle (create ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ get ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ update ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ soft delete)', async () => {
  const created = await departmentsRoute.POST(
    request(adminToken, {
      method: 'POST',
      url: `${BASE}/departments`,
      body: { name: 'V1 Test Department', nameDari: 'ÃƒËœÃ‚Â±Ãƒâ€ºÃ…â€™ÃƒËœÃ‚Â§ÃƒËœÃ‚Â³ÃƒËœÃ‚Âª ÃƒËœÃ‚Â¢ÃƒËœÃ‚Â²Ãƒâ„¢Ã¢â‚¬Â¦ÃƒËœÃ‚Â§Ãƒâ€ºÃ…â€™ÃƒËœÃ‚Â´Ãƒâ€ºÃ…â€™' },
    })
  )
  assert.equal(created.status, 201)
  const department = (await created.json()) as { id: string; name: string; isActive: boolean }
  createdDepartmentId = department.id
  createdIds.push(department.id)
  assert.equal(department.name, 'V1 Test Department')

  const fetched = await departmentRoute.GET(request(adminToken), params(department.id))
  assert.equal(fetched.status, 200)

  const updated = await departmentRoute.PUT(
    request(adminToken, { method: 'PUT', body: { description: 'updated by integration test' } }),
    params(department.id)
  )
  assert.equal(updated.status, 200)
  const updatedBody = (await updated.json()) as { description: string }
  assert.equal(updatedBody.description, 'updated by integration test')

  const duplicate = await departmentsRoute.POST(
    request(adminToken, { method: 'POST', url: `${BASE}/departments`, body: { name: 'V1 Test Department' } })
  )
  assert.equal(duplicate.status, 409, 'duplicate names are rejected')

  await departmentRoute.DELETE(request(adminToken, { method: 'DELETE' }), params(department.id))
  const afterDelete = await departmentRoute.GET(request(adminToken), params(department.id))
  assert.equal(afterDelete.status, 200)
  const deletedBody = (await afterDelete.json()) as { isActive: boolean }
  assert.equal(deletedBody.isActive, false, 'delete is a soft delete')
})

test('v1: grade create and read round-trip', async () => {
  const created = await gradesRoute.POST(
    request(adminToken, {
      method: 'POST',
      url: `${BASE}/academic/grades`,
      body: { name: 'Test Grade', level: 12, description: 'v1 integration grade' },
    })
  )
  assert.equal(created.status, 201)
  const grade = (await created.json()) as { id: string; name: string; level: number }
  createdGradeId = grade.id
  createdIds.push(grade.id)
  assert.equal(grade.level, 12)

  const fetched = await gradesItemRoute.GET(request(adminToken), params(grade.id))
  assert.equal(fetched.status, 200)

  await gradesItemRoute.PUT(
    request(adminToken, { method: 'PUT', body: { description: 'renamed' } }),
    params(grade.id)
  )
  await gradesItemRoute.DELETE(request(adminToken, { method: 'DELETE' }), params(grade.id))
  const afterDelete = await gradesItemRoute.GET(request(adminToken), params(grade.id))
  const softDeleted = (await afterDelete.json()) as { status: string }
  assert.equal(softDeleted.status, 'deleted')
})

test('v1: grade validation rejects an out-of-range level', async () => {
  const response = await gradesRoute.POST(
    request(adminToken, {
      method: 'POST',
      url: `${BASE}/academic/grades`,
      body: { name: 'Invalid Grade', level: 99 },
    })
  )
  assert.equal(response.status, 400)
  const body = (await response.json()) as { error: string }
  assert.match(body.error, /level/i)
})

test('v1: settings get/put round-trip', async () => {
  const getResponse = await settingsRoute.GET(request(adminToken, { url: `${BASE}/settings` }))
  assert.equal(getResponse.status, 200)
  const getBody = (await getResponse.json()) as { settings: Record<string, unknown> }
  assert.equal(getBody.settings.currency, 'AFN')

  const putResponse = await settingsRoute.PUT(
    request(adminToken, { method: 'PUT', url: `${BASE}/settings`, body: { lateFee: 75 } })
  )
  assert.equal(putResponse.status, 200)
  const putBody = (await putResponse.json()) as { settings: Record<string, unknown>; updated: string[] }
  assert.equal(putBody.settings.lateFee, 75)
  assert.ok(putBody.updated.includes('lateFee'))
})

test('v1: an invalid session cookie is rejected by the shared middleware', async () => {
  const rejection = await withAuth(
    async () => NextResponse.json({ ok: true }),
    { requireAll: ['settings:read'] }
  )(request('invalid-token'), { params: Promise.resolve({}) })
  assert.equal(rejection.status, 401)
})

after(async () => {
  for (const id of createdIds) {
    await pool.query('delete from departments where id = $1', [id]).catch(() => undefined)
    await pool.query('delete from grades where id = $1', [id]).catch(() => undefined)
  }
  if (createdDepartmentId) {
    await pool.query('delete from departments where id = $1', [createdDepartmentId]).catch(() => undefined)
  }
  if (createdGradeId) {
    await pool.query('delete from grades where id = $1', [createdGradeId]).catch(() => undefined)
  }
  await pool.query("delete from audit_logs where entity_id in ($1, $2)", [createdDepartmentId, createdGradeId]).catch(() => undefined)
  await pool.query('delete from users where email = $1', [V1_ADMIN_EMAIL]).catch(() => undefined)
  await pool.end().catch(() => undefined)
})
