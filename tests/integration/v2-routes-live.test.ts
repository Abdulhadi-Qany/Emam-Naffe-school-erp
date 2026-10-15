import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
// MUST be first: populates process.env (DATABASE_URL, BETTER_AUTH_*) before lib/* modules initialize.
import {
  ensureLiveDbSchema,
  LIVE_SCHOOL_ID,
  ADMIN_EMAIL,
  VIEWER_EMAIL,
  E2E_PASSWORD,
} from '../helpers/live-db'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { withAuth } from '@/src/infrastructure/http/middleware'
import * as studentsRoute from '@/app/api/v2/students/route'
import * as studentRoute from '@/app/api/v2/students/[id]/route'
import * as searchRoute from '@/app/api/v2/students/search/route'
import * as promoteRoute from '@/app/api/v2/students/[id]/promote/route'
import * as transferRoute from '@/app/api/v2/students/[id]/transfer/route'
import * as dropoutRoute from '@/app/api/v2/students/[id]/dropout/route'
import { DrizzleStudentRepository } from '@/src/infrastructure/persistence/drizzle/DrizzleStudentRepository'
import {
  StudentId,
  AdmissionNumber,
  TazkiraNumber,
  GradeLevel,
  StudentStatus,
  SpecialCategory,
} from '@/src/domain'

/**
 * End-to-end verification of the v2 student module against the real Postgres
 * database: better-auth session → RBAC → use cases → Drizzle → domain round-trip.
 * Requires a reachable DATABASE_URL in .env.local; cleans up after itself.
 */

const BASE = 'http://localhost:3000/api/v2/students'

let adminToken = ''
let viewerToken = ''
let viewerUserId = ''
let studentId = ''
let admissionNumber = ''
let secondStudentId = ''

function api(
  token: string | null,
  init: { method?: string; body?: unknown; url?: string } = {}
): NextRequest {
  const headers: Record<string, string> = { 'x-school-id': LIVE_SCHOOL_ID }
  if (token) headers.cookie = signedSessionCookie(token)
  let body: string | undefined
  if (init.body !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(init.body)
  }
  return new NextRequest(init.url ?? BASE, { method: init.method ?? 'GET', headers, body })
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })

/**
 * better-auth ≥1.4 signs the session cookie: value is `${token}.${base64 HMAC-SHA256}`.
 * Raw tokens in the cookie header fail verification and yield 401.
 */
function signedSessionCookie(token: string): string {
  const secret = process.env.BETTER_AUTH_SECRET
  assert.ok(secret, 'BETTER_AUTH_SECRET must be configured')
  const signature = createHmac('sha256', secret).update(token).digest('base64')
  return `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`
}

async function signUpAndSignIn(email: string, name: string): Promise<{ token: string; userId: string }> {
  const signUp = (await auth.api.signUpEmail({
    body: { email, password: E2E_PASSWORD, name },
    headers: new Headers(),
  })) as { token?: string; user?: { id: string } }
  const token =
    signUp.token ??
    (
      (await auth.api.signInEmail({
        body: { email, password: E2E_PASSWORD },
        headers: new Headers(),
      })) as { token: string }
    ).token
  const userId = signUp.user?.id ?? ''
  assert.ok(token, `session token expected for ${email}`)
  return { token, userId }
}

const ADMIT_BODY = {
  applyingForGrade: 1,
  section: 'A',
  firstNameDari: 'احمد',
  lastNameDari: 'احمدی',
  firstNamePashto: 'احمد',
  lastNamePashto: 'احمدي',
  firstNameEnglish: 'Ahmad',
  lastNameEnglish: 'Ahmadi',
  fatherName: 'Mohammad',
  grandfatherName: 'Abdullah',
  motherName: 'Fatima',
  dateOfBirthSolarHijri: { year: 1393, month: 11, day: 1 },
  gender: 'male',
  tazkiraNumber: '1010123456789',
  bloodGroup: 'A+',
  nationality: 'Afghan',
  motherTongue: 'Dari',
  sect: 'Sunni',
  currentProvince: 'Kabul',
  currentDistrict: 'District 5',
  currentVillage: 'Karte Naw',
  permanentProvince: 'Kabul',
  permanentDistrict: 'District 5',
  permanentVillage: 'Karte Naw',
  fatherMobile: '0701234567',
  guardianName: 'Shekib Ahmadi',
  guardianRelation: 'father',
  guardianOccupation: 'Farmer',
  guardianMobile: '0708765432',
  emergencyContactName: 'Mohammad',
  emergencyContactNumber: '0701234567',
  specialCategories: ['orphan'],
  documents: [{ type: 'tazkira', fileName: 'tazkira.pdf', fileUrl: 'https://x/tazkira.pdf' }],
  allowOutOfSchoolAge: true,
}

before(async () => {
  await ensureLiveDbSchema(pool)

  // Idempotent clean slate (cascades students, guardians, grades, staff_roles…).
  await pool.query(`DELETE FROM "user" WHERE email IN ($1, $2)`, [ADMIN_EMAIL, VIEWER_EMAIL])
  await pool.query(`DELETE FROM schools WHERE id = $1`, [LIVE_SCHOOL_ID])
  await pool.query(`INSERT INTO schools (id, name) VALUES ($1, $2)`, [LIVE_SCHOOL_ID, 'E2E Live Test School'])

  const admin = await signUpAndSignIn(ADMIN_EMAIL, 'E2E Admin')
  const viewer = await signUpAndSignIn(VIEWER_EMAIL, 'E2E Viewer')
  adminToken = admin.token
  viewerToken = viewer.token
  viewerUserId = viewer.userId
  assert.ok(adminToken && viewerUserId, 'better-auth must create users and sessions')
})

after(async () => {
  await pool.query(`DELETE FROM "user" WHERE email IN ($1, $2)`, [ADMIN_EMAIL, VIEWER_EMAIL])
  await pool.query(`DELETE FROM schools WHERE id = $1`, [LIVE_SCHOOL_ID])
  await pool.end()
})

test('GET /api/v2/students without a session returns 401', async () => {
  const res = await studentsRoute.GET(api(null))
  assert.equal(res.status, 401)
  const body = await res.json()
  assert.equal(body.success, false)
  assert.equal(body.error.code, 'UNAUTHORIZED')
})

test('POST /api/v2/students admits a student and bootstraps school_admin RBAC', async () => {
  const res = await studentsRoute.POST(api(adminToken, { method: 'POST', body: ADMIT_BODY }))
  assert.equal(res.status, 201)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.match(body.data.admissionNumber, /^EBPS-\d{4}-G1-\d{4}$/)
  assert.equal(body.data.gradeLevel, 1)
  studentId = body.data.studentId
  admissionNumber = body.data.admissionNumber
  assert.ok(studentId)
})

test('viewer without staff_roles on this school gets 403', async () => {
  const res = await studentsRoute.GET(api(viewerToken))
  assert.equal(res.status, 403)
  const body = await res.json()
  assert.equal(body.success, false)
  assert.equal(body.error.code, 'FORBIDDEN')
  assert.equal(body.error.message, 'Missing permission: students:read')
})

test('GET /api/v2/students returns school-scoped, filtered pagination', async () => {
  const res = await studentsRoute.GET(api(adminToken, { url: `${BASE}?page=1&limit=10` }))
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.equal(body.pagination.total, 1)
  assert.equal(body.pagination.totalPages, 1)
  assert.equal(body.data.length, 1)
  assert.equal(body.data[0].fullNameEnglish, 'Ahmad Ahmadi')
  assert.equal(body.data[0].gradeLevel, 1)
  assert.equal(body.data[0].section, 'A')
  assert.equal(body.data[0].status, 'active')
  assert.match(body.data[0].province, /Kabul/)
})

test('GET /api/v2/students/:id returns the full read model', async () => {
  const res = await studentRoute.GET(api(adminToken, { url: `${BASE}/${studentId}` }), params(studentId))
  assert.equal(res.status, 200)
  const body = await res.json()
  const read = body.data
  assert.equal(body.success, true)
  assert.equal(read.id, studentId)
  assert.equal(read.admissionNumber, admissionNumber)
  assert.equal(read.personalInfo.fullNameEnglish, 'Ahmad Ahmadi')
  assert.equal(read.personalInfo.tazkiraNumber, '1010123456789')
  assert.equal(read.contactInfo.fatherMobile, '+93701234567')
  assert.equal(read.guardian.name, 'Shekib Ahmadi')
  assert.equal(read.guardian.relation, 'father')
  assert.equal(read.guardian.mobile, '+93708765432')
  assert.equal(read.academicInfo.gradeLevel, 1)
  assert.equal(read.academicInfo.section, 'A')
  assert.equal(read.academicInfo.status, 'active')
  assert.deepEqual(read.specialCategories, ['orphan']) // persisted via student_special_categories
  assert.equal(read.documents.length, 1)
  assert.equal(read.documents[0].verified, false)
  assert.equal(read.healthRecord.emergencyContactName, 'Mohammad')
})

test('GET /api/v2/students/:id returns 404 for malformed and unknown ids', async () => {
  const malformed = await studentRoute.GET(api(adminToken, { url: `${BASE}/not-a-uuid` }), params('not-a-uuid'))
  assert.equal(malformed.status, 404)
  assert.equal((await malformed.json()).error.code, 'NOT_FOUND')

  const unknown = '00000000-0000-4000-8000-000000000000'
  const res = await studentRoute.GET(api(adminToken, { url: `${BASE}/${unknown}` }), params(unknown))
  assert.equal(res.status, 404)
  assert.equal((await res.json()).error.code, 'STUDENT_NOT_FOUND')
})

test('POST /api/v2/students returns 400 with field details on invalid commands', async () => {
  const res = await studentsRoute.POST(
    api(adminToken, { method: 'POST', body: { ...ADMIT_BODY, firstNameEnglish: '' } })
  )
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.ok('firstNameEnglish' in body.error.details)

  const dup = await studentsRoute.POST(api(adminToken, { method: 'POST', body: ADMIT_BODY }))
  assert.equal(dup.status, 400)
  const dupBody = await dup.json()
  assert.equal(dupBody.error.code, 'VALIDATION_ERROR')
  assert.ok('tazkiraNumber' in dupBody.error.details)
})


test('PATCH /api/v2/students/:id updates contact, guardian and health persistently', async () => {
  const res = await studentRoute.PATCH(
    api(adminToken, {
      method: 'PATCH',
      url: `${BASE}/${studentId}`,
      body: { fatherMobile: '0709876543', guardianMobile: '0701111222', chronicIllness: 'Asthma' },
    }),
    params(studentId)
  )
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.deepEqual([...body.data.updatedFields].sort(), ['chronicIllness', 'fatherMobile', 'guardianMobile'])

  // Reload from DB — proves students.father_mobile, guardian and health upserts.
  const get = await studentRoute.GET(api(adminToken, { url: `${BASE}/${studentId}` }), params(studentId))
  const read = (await get.json()).data
  assert.equal(read.contactInfo.fatherMobile, '+93709876543')
  assert.equal(read.guardian.mobile, '+93701111222')
  assert.equal(read.healthRecord.chronicIllness, 'Asthma')
})

test('PATCH with an invalid phone returns 422 (domain rule via route)', async () => {
  const res = await studentRoute.PATCH(
    api(adminToken, { method: 'PATCH', url: `${BASE}/${studentId}`, body: { fatherMobile: 'abc' } }),
    params(studentId)
  )
  assert.equal(res.status, 422)
  assert.equal((await res.json()).success, false)
})

test('GET /api/v2/students/search routes term and structured filters', async () => {
  const byName = await searchRoute.GET(api(adminToken, { url: `${BASE}/search?q=Ahmad` }))
  assert.equal(byName.status, 200)
  assert.equal((await byName.json()).pagination.total, 1)

  const byTazkira = await searchRoute.GET(api(adminToken, { url: `${BASE}/search?q=1010123456789` }))
  assert.equal((await byTazkira.json()).pagination.total, 1)

  const byAdmission = await searchRoute.GET(api(adminToken, { url: `${BASE}/search?q=${admissionNumber}` }))
  assert.equal((await byAdmission.json()).pagination.total, 1)

  const byGrade = await searchRoute.GET(api(adminToken, { url: `${BASE}/search?grade=1` }))
  assert.equal((await byGrade.json()).pagination.total, 1)

  const wrongGrade = await searchRoute.GET(api(adminToken, { url: `${BASE}/search?grade=9` }))
  assert.equal((await wrongGrade.json()).pagination.total, 0)

  const enrollmentYear = admissionNumber.split('-')[1]
  const byYear = await searchRoute.GET(api(adminToken, { url: `${BASE}/search?year=${enrollmentYear}` }))
  assert.equal((await byYear.json()).pagination.total, 1)
})

test('POST promote persists the new grade/section through grades & sections tables', async () => {
  const res = await promoteRoute.POST(
    api(adminToken, {
      method: 'POST',
      url: `${BASE}/${studentId}/promote`,
      body: { newSection: 'B', reason: 'Excellent results' },
    }),
    params(studentId)
  )
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.data.previousGrade, 1)
  assert.equal(body.data.newGrade, 2)
  assert.equal(body.data.newSection, 'B')
  assert.equal(body.data.status, 'active')

  // Round-trip: grade/section must be rehydrated from the DB, not hardcoded.
  const get = await studentRoute.GET(api(adminToken, { url: `${BASE}/${studentId}` }), params(studentId))
  const read = (await get.json()).data
  assert.equal(read.academicInfo.gradeLevel, 2)
  assert.equal(read.academicInfo.section, 'B')
})

test('POST transfer without a JSON body returns 400 validation — never 500', async () => {
  const res = await transferRoute.POST(
    api(adminToken, { method: 'POST', url: `${BASE}/${studentId}/transfer` }),
    params(studentId)
  )
  // Pre-fix this was a guaranteed 500 (TypeError from the misplaced .catch).
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.ok('reason' in body.error.details)
})

test('POST transfer persists the transferred status (enum)', async () => {
  const res = await transferRoute.POST(
    api(adminToken, {
      method: 'POST',
      url: `${BASE}/${studentId}/transfer`,
      body: { reason: 'Family relocated to Herat', receivingSchool: 'Herat High' },
    }),
    params(studentId)
  )
  assert.equal(res.status, 200)
  assert.equal((await res.json()).data.status, 'transferred')

  const get = await studentRoute.GET(api(adminToken, { url: `${BASE}/${studentId}` }), params(studentId))
  assert.equal((await get.json()).data.academicInfo.status, 'transferred')
})

test('second admit + dropout persists dropped_out status (enum)', async () => {
  const admit = await studentsRoute.POST(
    api(adminToken, {
      method: 'POST',
      body: {
        ...ADMIT_BODY,
        firstNameEnglish: 'Sohrab',
        lastNameEnglish: 'Karimi',
        tazkiraNumber: '1098765432109',
        fatherMobile: '0798765431',
        section: 'C',
        specialCategories: undefined,
        documents: [],
      },
    })
  )
  assert.equal(admit.status, 201, 'second admission must succeed')
  const admitted = await admit.json()
  secondStudentId = admitted.data.studentId

  const res = await dropoutRoute.POST(
    api(adminToken, {
      method: 'POST',
      url: `${BASE}/${secondStudentId}/dropout`,
      body: { reason: 'Family left the city' },
    }),
    params(secondStudentId)
  )
  assert.equal(res.status, 200)
  assert.equal((await res.json()).data.status, 'dropped_out')

  const get = await studentRoute.GET(api(adminToken, { url: `${BASE}/${secondStudentId}` }), params(secondStudentId))
  assert.equal((await get.json()).data.academicInfo.status, 'dropped_out')
})


test('withAuth maps 401 / 403 / success', async () => {
  const wrapped = withAuth(async () => NextResponse.json({ ok: true }), { requireAll: ['students:read'] })

  const unauthorized = await wrapped(api(null), { params: Promise.resolve({}) })
  assert.equal(unauthorized.status, 401)
  assert.equal((await unauthorized.json()).error.code, 'UNAUTHORIZED')

  const forbidden = await wrapped(api(viewerToken), { params: Promise.resolve({}) })
  assert.equal(forbidden.status, 403)
  assert.equal((await forbidden.json()).error.code, 'FORBIDDEN')

  const ok = await wrapped(api(adminToken), { params: Promise.resolve({}) })
  assert.equal(ok.status, 200)
  assert.deepEqual(await ok.json(), { ok: true })
})

test('explicit staff_roles grant: read allowed, write still forbidden', async () => {
  await pool.query(
    `INSERT INTO staff_roles (id, school_id, user_id, role, permissions) VALUES ($1, $2, $3, $4, $5)`,
    [crypto.randomUUID(), LIVE_SCHOOL_ID, viewerUserId, 'class_teacher', JSON.stringify(['students:read'])]
  )

  const read = await studentsRoute.GET(api(viewerToken))
  assert.equal(read.status, 200)
  assert.ok((await read.json()).pagination.total >= 1)

  const write = await studentsRoute.POST(api(viewerToken, { method: 'POST', body: ADMIT_BODY }))
  assert.equal(write.status, 403)
  assert.equal((await write.json()).error.code, 'FORBIDDEN')
})

test('DrizzleStudentRepository round-trips every query in the port', async () => {
  const repo = new DrizzleStudentRepository()

  const byTazkira = await repo.findByTazkiraNumber(TazkiraNumber.create('1010123456789'))
  assert.ok(byTazkira)
  assert.equal(byTazkira.getId().getValue(), studentId)

  const byAdmission = await repo.findByAdmissionNumber(AdmissionNumber.fromString(admissionNumber))
  assert.ok(byAdmission)
  assert.equal(byAdmission.getGradeLevel().getGrade(), 2)

  const byId = await repo.findById(StudentId.fromString(studentId))
  assert.ok(byId)
  assert.equal(byId.getSection().getValue(), 'B')
  assert.equal(byId.getFatherPhone().getValue(), '+93709876543')
  assert.equal(byId.getGuardian()?.getPhoneNumber().getValue(), '+93701111222')

  const transferred = await repo.findByStatus(StudentStatus.TRANSFERRED)
  assert.ok(transferred.some((s) => s.getId().getValue() === studentId))

  const dropped = await repo.findByStatus(StudentStatus.DROPPED_OUT)
  assert.deepEqual(dropped.map((s) => s.getId().getValue()), [secondStudentId])

  const orphans = await repo.findBySpecialCategory(SpecialCategory.ORPHAN)
  assert.ok(orphans.some((s) => s.getId().getValue() === studentId))

  const inGrade2B = await repo.findByGrade(GradeLevel.create(2), 'B')
  assert.ok(inGrade2B.some((s) => s.getId().getValue() === studentId))

  const admittedToGrade1 = await repo.countByGrade(GradeLevel.create(1))
  assert.equal(admittedToGrade1, 2) // admission number keeps entry grade

  const byFatherPhone = await repo.findByFatherPhone('0709876543') // local format normalizes (PATCH updated it earlier)
  assert.ok(byFatherPhone.some((s) => s.getId().getValue() === studentId))

  assert.equal(await repo.existsByTazkiraNumber(TazkiraNumber.create('1010123456789')), true)
  assert.equal(await repo.existsByTazkiraNumber(TazkiraNumber.create('9999999999999')), false)

  const activeOnly = await repo.findAll(
    { schoolId: LIVE_SCHOOL_ID, status: StudentStatus.ACTIVE },
    { page: 1, limit: 50 }
  )
  assert.equal(activeOnly.total, 0) // one transferred, one dropped out

  const named = await repo.findAll({ schoolId: LIVE_SCHOOL_ID, name: 'Ahmad' }, { page: 1, limit: 50 })
  assert.equal(named.total, 1)

  // delete removes the aggregate
  await repo.delete(StudentId.fromString(secondStudentId))
  assert.equal(await repo.findById(StudentId.fromString(secondStudentId)), null)
})

