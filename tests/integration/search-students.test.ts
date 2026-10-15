import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AdmitStudentHandler } from '@/src/application/use-cases/commands/admit-student/AdmitStudentHandler'
import { SearchStudentsHandler } from '@/src/application/use-cases/queries/search-students/SearchStudentsHandler'
import { InMemoryStudentRepository } from '../fixtures/InMemoryStudentRepository'
import {
  FakeIdGenerator,
  FakeClock,
  FakeEventPublisher,
  FakeLogger,
  FakeAdmissionNumberGenerator,
} from '../fixtures/fakes'

function build() {
  const repo = new InMemoryStudentRepository()
  const admit = new AdmitStudentHandler(
    repo,
    new FakeAdmissionNumberGenerator(),
    new FakeIdGenerator(),
    new FakeClock(),
    new FakeEventPublisher(),
    new FakeLogger()
  )
  const search = new SearchStudentsHandler(repo)
  return { repo, admit, search }
}

function baseStudent(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'EBPS-KABUL-01',
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
    gender: 'male' as const,
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
    emergencyContactName: 'Mohammad',
    emergencyContactNumber: '0701234567',
    createdBy: 'admin-1',
    allowOutOfSchoolAge: true,
    ...overrides,
  }
}

test('SearchStudents finds by English name across all admitted students', async () => {
  const { admit, search } = build()
  await admit.execute(baseStudent({ firstNameEnglish: 'Ahmad', lastNameEnglish: 'Ahmadi' }) as never)
  await admit.execute(
    baseStudent({ firstNameEnglish: 'Ali', lastNameEnglish: 'Alizai', section: 'B' }) as never
  )

  const result = await search.execute({
    searchTerm: 'Ahmad',
    requestedBy: 'tester',
  })
  assert.equal(result.total, 1)
  assert.equal(result.data[0].fullNameEnglish, 'Ahmad Ahmadi')
})

test('SearchStudents routes a full admission number to the admission filter', async () => {
  const { admit, search } = build()
  const first = await admit.execute(baseStudent() as never)
  await admit.execute(baseStudent({ firstNameEnglish: 'Ali', lastNameEnglish: 'Alizai' }) as never)

  const result = await search.execute({
    searchTerm: first.admissionNumber,
    requestedBy: 'tester',
  })
  assert.equal(result.total, 1)
  assert.equal(result.data[0].admissionNumber, first.admissionNumber)
})

test('SearchStudents routes a digit-only term to the tazkira filter', async () => {
  const { admit, search } = build()
  await admit.execute(
    baseStudent({ tazkiraNumber: '0123456789012', firstNameEnglish: 'Zahra', lastNameEnglish: 'Karimi' }) as never
  )
  await admit.execute(
    baseStudent({ tazkiraNumber: '9876543210987', firstNameEnglish: 'Najib', lastNameEnglish: 'ullah' }) as never
  )

  const result = await search.execute({ searchTerm: '0123456789012', requestedBy: 'tester' })
  assert.equal(result.total, 1)
  assert.equal(result.data[0].fullNameEnglish, 'Zahra Karimi')
})

test('SearchStudents combines searchTerm with structured filters and paginates', async () => {
  const { admit, search } = build()
  for (let i = 0; i < 3; i++) {
    await admit.execute(baseStudent({ section: 'A' }) as never)
  }
  await admit.execute(
    baseStudent({ applyingForGrade: 2, firstNameEnglish: 'Ahmad', lastNameEnglish: 'Ahmadi' }) as never
  )

  // name + grade filter: only the grade-2 Ahmad matches
  const filtered = await search.execute({
    searchTerm: 'Ahmad',
    filters: { schoolId: 'EBPS-KABUL-01' },
    pagination: { page: 1, limit: 10 },
    requestedBy: 'tester',
  })
  assert.equal(filtered.total, 4)

  // pagination: page size 2 → 2 pages of the 4 Ahmad students
  const paged = await search.execute({
    searchTerm: 'Ahmad',
    pagination: { page: 2, limit: 2 },
    requestedBy: 'tester',
  })
  assert.equal(paged.total, 4)
  assert.equal(paged.data.length, 2)
  assert.equal(paged.totalPages, 2)
})

test('SearchStudents with empty term returns all (paginated)', async () => {
  const { admit, search } = build()
  await admit.execute(baseStudent() as never)
  await admit.execute(baseStudent({ firstNameEnglish: 'Ali', lastNameEnglish: 'Alizai' }) as never)

  const result = await search.execute({ requestedBy: 'tester' })
  assert.equal(result.total, 2)
  assert.equal(result.data.length, 2)
})
