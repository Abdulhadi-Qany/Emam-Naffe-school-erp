import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AdmitStudentHandler } from '@/src/application/use-cases/commands/admit-student/AdmitStudentHandler'
import { PromoteStudentHandler } from '@/src/application/use-cases/commands/promote-student/PromoteStudentHandler'
import { TransferStudentHandler } from '@/src/application/use-cases/commands/transfer-student/TransferStudentHandler'
import { DropoutStudentHandler } from '@/src/application/use-cases/commands/dropout-student/DropoutStudentHandler'
import { UpdateStudentHandler } from '@/src/application/use-cases/commands/update-student/UpdateStudentHandler'
import { NotFoundError, ValidationError } from '@/src/application/exceptions'
import { AdmissionNumber } from '@/src/domain'
import { InMemoryStudentRepository } from '../fixtures/InMemoryStudentRepository'
import {
  FakeIdGenerator,
  FakeClock,
  FakeEventPublisher,
  FakeLogger,
  FakeAdmissionNumberGenerator,
} from '../fixtures/fakes'
import type { AdmitStudentCommand } from '@/src/application/use-cases/commands/admit-student/AdmitStudentCommand'

const baseCommand = {
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
} satisfies AdmitStudentCommand

async function admitStudent(overrides: Partial<AdmitStudentCommand> = {}) {
  const repo = new InMemoryStudentRepository()
  const events = new FakeEventPublisher()
  const admit = new AdmitStudentHandler(
    repo,
    new FakeAdmissionNumberGenerator(),
    new FakeIdGenerator(),
    new FakeClock(),
    events,
    new FakeLogger()
  )
  const admitted = await admit.execute({ ...baseCommand, ...overrides })
  return { repo, events, admitted }
}

test('PromoteStudentHandler promotes one grade and persists it', async () => {
  const { repo, admitted } = await admitStudent()
  const handler = new PromoteStudentHandler(repo, new FakeEventPublisher(), new FakeLogger())

  const result = await handler.execute({
    studentId: admitted.studentId,
    newSection: 'B',
    updatedBy: 'admin-1',
  })

  assert.equal(result.previousGrade, 1)
  assert.equal(result.newGrade, 2)
  assert.equal(result.newSection, 'B')
  assert.equal(result.status, 'active')

  const saved = await repo.findByAdmissionNumber(AdmissionNumber.fromString(admitted.admissionNumber))
  assert.ok(saved)
  assert.equal(saved!.getGradeLevel().getGrade(), 2)
})

test('PromoteStudentHandler throws NotFoundError for unknown student', async () => {
  const { repo } = await admitStudent()
  const handler = new PromoteStudentHandler(repo, new FakeEventPublisher(), new FakeLogger())
  await assert.rejects(
    () => handler.execute({ studentId: '00000000-0000-4000-8000-000000000000', updatedBy: 'a' }),
    NotFoundError
  )
})

test('TransferStudentHandler validates reason and transitions status', async () => {
  const { repo, admitted } = await admitStudent()
  const handler = new TransferStudentHandler(repo, new FakeEventPublisher(), new FakeLogger())

  await assert.rejects(
    () => handler.execute({ studentId: admitted.studentId, reason: 'no', updatedBy: 'a' }),
    ValidationError
  )

  const result = await handler.execute({
    studentId: admitted.studentId,
    reason: 'Family relocated to Herat',
    updatedBy: 'a',
  })
  assert.equal(result.status, 'transferred')
})

test('DropoutStudentHandler validates reason and transitions status', async () => {
  const { repo, admitted } = await admitStudent()
  const handler = new DropoutStudentHandler(repo, new FakeEventPublisher(), new FakeLogger())

  await assert.rejects(
    () => handler.execute({ studentId: admitted.studentId, reason: 'x', updatedBy: 'a' }),
    ValidationError
  )

  const result = await handler.execute({
    studentId: admitted.studentId,
    reason: 'Family could not afford school fees',
    updatedBy: 'a',
  })
  assert.equal(result.status, 'dropped_out')
})

test('UpdateStudentHandler updates only provided fields', async () => {
  const { repo, admitted } = await admitStudent({ email: 'old@example.com' })
  const handler = new UpdateStudentHandler(repo, new FakeEventPublisher(), new FakeLogger())

  const result = await handler.execute({
    studentId: admitted.studentId,
    fatherMobile: '0749999999',
    email: 'new@example.com',
    updatedBy: 'admin-1',
  })

  assert.deepEqual(result.updatedFields.sort(), ['email', 'fatherMobile'])

  const saved = (await repo.findAll({}, { page: 1, limit: 1 })).data[0]
  assert.equal(saved.getFatherPhone().getValue(), '+93749999999')
  assert.equal(saved.getEmail()?.getValue(), 'new@example.com')
  // untouched field stays the same
  assert.equal(saved.getFullNameEnglish(), 'Ahmad Ahmadi')
})

test('UpdateStudentHandler rejects invalid phone numbers', async () => {
  const { repo, admitted } = await admitStudent()
  const handler = new UpdateStudentHandler(repo, new FakeEventPublisher(), new FakeLogger())
  await assert.rejects(
    () =>
      handler.execute({
        studentId: admitted.studentId,
        fatherMobile: '12345',
        updatedBy: 'a',
      }),
    /Validation|phone|Phone/i
  )
})
