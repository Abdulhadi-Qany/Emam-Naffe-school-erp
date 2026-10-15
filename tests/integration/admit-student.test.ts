import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AdmitStudentHandler } from '@/src/application/use-cases/commands/admit-student/AdmitStudentHandler'
import { GetStudentHandler } from '@/src/application/use-cases/queries/get-student/GetStudentHandler'
import { ListStudentsHandler } from '@/src/application/use-cases/queries/list-students/ListStudentsHandler'
import { ValidationError } from '@/src/application/exceptions'
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
  const events = new FakeEventPublisher()
  const handler = new AdmitStudentHandler(
    repo,
    new FakeAdmissionNumberGenerator(),
    new FakeIdGenerator(),
    new FakeClock(),
    events,
    new FakeLogger()
  )
  return { repo, events, handler }
}

const validCommand = {
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
  specialCategories: ['orphan'],
  documents: [{ type: 'tazkira', fileName: 'tazkira.pdf', fileUrl: 'https://x/tazkira.pdf' }],
}

test('AdmitStudentHandler admits a student, persists it and publishes an event', async () => {
  const { repo, events, handler } = build()
  const result = await handler.execute(validCommand as never)

  assert.match(result.admissionNumber, /^EBPS-\d{4}-G1-\d{4}$/)
  assert.equal(result.fullNameEnglish, 'Ahmad Ahmadi')
  assert.equal(result.gradeLevel, 1)
  assert.equal(events.published.length, 1)
  assert.equal(events.published[0].eventName, 'StudentEnrolled')

  const saved = await repo.findById((await repo.findAll({}, { page: 1, limit: 1 })).data[0].getId())
  assert.ok(saved)
  assert.equal(saved!.getDocuments().length, 1)
  assert.equal(saved!.hasSpecialCategory('orphan' as never), true)
})

test('AdmitStudentHandler rejects invalid commands with field errors', async () => {
  const { handler } = build()
  await assert.rejects(
    () => handler.execute({ ...validCommand, firstNameEnglish: '' } as never),
    (err: unknown) => err instanceof ValidationError && 'firstNameEnglish' in err.errors
  )
})

test('AdmitStudentHandler rejects duplicate Tazkira number', async () => {
  const { handler } = build()
  const cmd = { ...validCommand, tazkiraNumber: '1234567890123' } as never
  await handler.execute(cmd)
  await assert.rejects(() => handler.execute(cmd), /Tazkira number already exists/)
})

test('GetStudentHandler returns a read model; ListStudentsHandler paginates', async () => {
  const { repo, handler } = build()
  const admitted = await handler.execute(validCommand as never)

  const getHandler = new GetStudentHandler(repo)
  const read = await getHandler.execute({ studentId: admitted.studentId, requestedBy: 'admin' })
  assert.equal(read.admissionNumber, admitted.admissionNumber)
  assert.equal(read.academicInfo.section, 'A')
  assert.equal(read.documents?.length, 1)

  const listHandler = new ListStudentsHandler(repo)
  const page = await listHandler.execute({ pagination: { page: 1, limit: 10 }, requestedBy: 'admin' })
  assert.equal(page.total, 1)
  assert.equal(page.data[0].fullNameEnglish, 'Ahmad Ahmadi')
})
