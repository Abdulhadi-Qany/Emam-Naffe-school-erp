import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  Student,
  StudentDocument,
  Address,
  Guardian,
  HealthRecord,
  Money,
  StudentId,
  AdmissionNumber,
  TazkiraNumber,
  PhoneNumber,
  DateOfBirth,
  GradeLevel,
  Section,
  StudentStatus,
  Gender,
  BloodGroup,
  SpecialCategory,
  GuardianRelation,
  DomainError,
  DuplicateAdmissionError,
  StudentNotFoundError,
  AgeCalculator,
} from '@/src/domain'

/** Builds a valid Student via the factory; grade defaults to 1. */
function makeStudent(grade = 1, overrides: Record<string, unknown> = {}): Student {
  return Student.enroll({
    id: StudentId.generate(),
    schoolId: 'EBPS-KABUL-01',
    admissionNumber: AdmissionNumber.create(1403, `G${grade}`, 1),
    firstNameDari: 'احمد',
    lastNameDari: 'احمدی',
    firstNamePashto: 'احمد',
    lastNamePashto: 'احمدي',
    firstNameEnglish: 'Ahmad',
    lastNameEnglish: 'Ahmadi',
    fatherName: 'Mohammad',
    grandfatherName: 'Abdullah',
    motherName: 'Fatima',
    dateOfBirth: DateOfBirth.fromSolarHijri(1393, 11, 1),
    gender: Gender.MALE,
    bloodGroup: BloodGroup.A_POSITIVE,
    nationality: 'Afghan',
    motherTongue: 'Dari',
    sect: 'Sunni',
    currentAddress: Address.create({ province: 'Kabul', district: 'District 5', village: 'Karte Naw' }),
    permanentAddress: Address.create({ province: 'Kabul', district: 'District 5', village: 'Karte Naw' }),
    fatherPhone: PhoneNumber.create('0701234567'),
    gradeLevel: GradeLevel.create(grade),
    section: Section.create('A'),
    admissionDate: new Date(),
    enrollmentDate: new Date(),
    status: StudentStatus.ACTIVE,
    specialCategories: [],
    documents: [],
    feeWaiverPercentage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never)
}

// ─── Student: factory guards ────────────────────────────────────────────────

test('enroll rejects out-of-school-age DOB unless explicitly allowed', () => {
  assert.throws(
    () => makeStudent(1, { dateOfBirth: DateOfBirth.fromSolarHijri(1370, 1, 1) }),
    DomainError
  )
  const ok = makeStudent(1, {
    dateOfBirth: DateOfBirth.fromSolarHijri(1370, 1, 1),
    allowOutOfSchoolAge: true,
  })
  assert.equal(ok.getStatus(), StudentStatus.ACTIVE)
})

test('enroll rejects names shorter than 2 characters', () => {
  assert.throws(() => makeStudent(1, { firstNameEnglish: 'A' }), DomainError)
})

// ─── Student: lifecycle guards ──────────────────────────────────────────────

test('promoteTo refuses non-active students', () => {
  const s = makeStudent()
  s.transferOut('Moving to Herat province')
  assert.throws(() => s.promoteTo(GradeLevel.create(2), Section.create('B')), DomainError)
})

test('transferOut and markAsDroppedOut refuse non-active students', () => {
  const dropped = makeStudent()
  dropped.markAsDroppedOut('Family left the city')
  assert.throws(() => dropped.transferOut('Moving abroad'), DomainError)

  const transferred = makeStudent()
  transferred.transferOut('Moving to Herat province')
  assert.throws(() => transferred.markAsDroppedOut('Family left the city'), DomainError)
})

// ─── Student: mutation methods ──────────────────────────────────────────────

test('updateContactInfo updates only provided contact fields', () => {
  const s = makeStudent()
  const before = s.getUpdatedAt()
  s.updateContactInfo({
    fatherPhone: PhoneNumber.create('0787654321'),
    currentAddress: Address.create({ province: 'Herat', district: 'District 1', village: 'Shahr Naw' }),
  })
  assert.equal(s.getFatherPhone().getValue(), '+93787654321')
  assert.equal(s.getCurrentAddress().getProvince(), 'Herat')
  assert.equal(s.getPermanentAddress().getProvince(), 'Kabul')
  assert.ok(s.getUpdatedAt().getTime() >= before.getTime())
})

test('updateHealthRecord replaces the record', () => {
  const s = makeStudent()
  const record = HealthRecord.create({
    vaccinationStatus: 'Complete',
    emergencyContactName: 'Mohammad',
    emergencyContactNumber: '0701234567',
  })
  s.updateHealthRecord(record)
  assert.equal(s.getHealthRecord()?.getVaccinationStatus(), 'Complete')
})

test('addSpecialCategory is idempotent; removeSpecialCategory removes it', () => {
  const s = makeStudent()
  s.addSpecialCategory(SpecialCategory.DISABILITY)
  s.addSpecialCategory(SpecialCategory.DISABILITY)
  assert.equal(s.getSpecialCategories().length, 1)
  assert.equal(s.hasSpecialCategory(SpecialCategory.DISABILITY), true)
  s.removeSpecialCategory(SpecialCategory.DISABILITY)
  assert.equal(s.hasSpecialCategory(SpecialCategory.DISABILITY), false)
})

test('applyFeeWaiver rejects missing reason for >0 percentage', () => {
  const s = makeStudent()
  assert.throws(() => s.applyFeeWaiver(50, ''), DomainError)
  s.applyFeeWaiver(0, '')
  assert.equal(s.hasFeeWaiver(), false)
})

test('addDocument rejects duplicate type+filename; verifyDocument works and rejects unknown id', () => {
  const s = makeStudent()
  const doc = StudentDocument.create({
    id: 'doc-1',
    type: 'tazkira',
    fileName: 'tazkira.pdf',
    fileUrl: 'https://x/tazkira.pdf',
    uploadedAt: new Date(),
  })
  s.addDocument(doc)
  assert.throws(
    () =>
      s.addDocument(
        StudentDocument.create({
          id: 'doc-2',
          type: 'tazkira',
          fileName: 'tazkira.pdf',
          fileUrl: 'https://x/other.pdf',
          uploadedAt: new Date(),
        })
      ),
    DomainError
  )
  s.verifyDocument('doc-1')
  assert.equal(s.getDocuments()[0].isVerified(), true)
  assert.throws(() => s.verifyDocument('missing-id'), DomainError)
})

test('updatePhoto and assignRollNumber validate and mutate', () => {
  const s = makeStudent()
  s.updatePhoto('https://x/photo.jpg')
  assert.equal(s.getPhotoUrl(), 'https://x/photo.jpg')
  s.assignRollNumber(7)
  assert.equal(s.getRollNumber(), 7)
  assert.throws(() => s.assignRollNumber(0), DomainError)

test('isEligibleForPromotion requires active status and minimum attendance', () => {
  const s = makeStudent()
  assert.equal(s.isEligibleForPromotion(75, 80), true)
  assert.equal(s.isEligibleForPromotion(75, 70), false)
  s.transferOut('Moving to Kandahar province')
  assert.equal(s.isEligibleForPromotion(75, 100), false)
})

test('calculateFeeAfterWaiver applies the configured percentage', () => {
  const s = makeStudent()
  s.applyFeeWaiver(25, 'Sibling discount applies here')
  assert.equal(s.calculateFeeAfterWaiver(Money.fromAFN(1000)).getAmount(), 750)
  const noWaiver = makeStudent()
  assert.equal(noWaiver.calculateFeeAfterWaiver(Money.fromAFN(500)).getAmount(), 500)
})

test('toProps returns defensive copies of arrays', () => {
  const s = makeStudent()
  const props = s.toProps()
  props.specialCategories.push(SpecialCategory.ORPHAN)
  props.documents.push(
    StudentDocument.create({
      id: 'x',
      type: 'tazkira',
      fileName: 'x.pdf',
      fileUrl: 'https://x/x.pdf',
      uploadedAt: new Date(),
    })
  )
  assert.equal(s.getSpecialCategories().length, 0)
  assert.equal(s.getDocuments().length, 0)
})

// ─── StudentDocument ────────────────────────────────────────────────────────

test('StudentDocument defaults verified=false and verify() flips it', () => {
  const doc = StudentDocument.create({
    id: 'doc-9',
    type: 'report_card',
    fileName: 'report.pdf',
    fileUrl: 'https://x/report.pdf',
    uploadedAt: new Date(),
  })
  assert.equal(doc.isVerified(), false)
  doc.verify()
  assert.equal(doc.isVerified(), true)
  assert.equal(doc.toProps().type, 'report_card')
})

// ─── Money: remaining arithmetic ────────────────────────────────────────────

test('Money.zero, multiply, percentage, comparisons, formatting and equality', () => {
  assert.equal(Money.zero().isZero(), true)
  assert.equal(Money.fromAFN(100).multiply(2.5).getAmount(), 250)
  assert.throws(() => Money.fromAFN(100).multiply(-1), DomainError)
  assert.equal(Money.fromAFN(200).percentage(12.5).getAmount(), 25)
  assert.throws(() => Money.fromAFN(200).percentage(150), DomainError)
  const a = Money.fromAFN(500)
  const b = Money.fromAFN(1000)
  assert.equal(b.isGreaterThan(a), true)
  assert.equal(a.isLessThan(b), true)
  assert.throws(() => Money.fromAFN(-5), DomainError)
  assert.throws(() => Money.fromAFN(Number.POSITIVE_INFINITY), DomainError)
  assert.throws(() => a.subtract(b), DomainError)
  assert.equal(Money.fromAFN(1500).getCurrency(), 'AFN')
  assert.equal(Money.fromAFN(1500).toString(), '1500 AFN')
  assert.ok(Money.fromAFN(1500).format('en').length > 0)
  assert.equal(Money.fromAFN(1500).equals(Money.fromAFN(1500)), true)
  assert.equal(Money.fromAFN(1500).equals(Money.fromAFN(999)), false)
})

// ─── AgeCalculator ──────────────────────────────────────────────────────────

test('AgeCalculator computes age on a reference date and school-age status', () => {
  const dob = DateOfBirth.fromSolarHijri(1393, 11, 1)
  assert.ok(AgeCalculator.ageOn(dob, new Date('2024-03-21')) >= 9)
  assert.equal(AgeCalculator.isSchoolAge(dob), true)
  assert.equal(AgeCalculator.isSchoolAge(DateOfBirth.fromSolarHijri(1370, 1, 1)), false)
})

// ─── Error classes ──────────────────────────────────────────────────────────

test('DuplicateAdmissionError and StudentNotFoundError carry codes and details', () => {
  const dup = new DuplicateAdmissionError('EBPS-1403-G1-0001')
  assert.equal(dup.name, 'DuplicateAdmissionError')
  assert.equal(dup.code, 'DUPLICATE_ADMISSION')
  assert.deepEqual(dup.details, { admissionNumber: 'EBPS-1403-G1-0001' })

  const missing = new StudentNotFoundError('stu-123')
  assert.equal(missing.name, 'StudentNotFoundError')
  assert.equal(missing.code, 'STUDENT_NOT_FOUND')
  assert.deepEqual(missing.details, { identifier: 'stu-123' })
})

// ─── reconstitute round-trip ────────────────────────────────────────────────

test('Student.reconstitute rebuilds an aggregate from stored props', () => {
  const original = makeStudent()
  const rebuilt = Student.reconstitute(original.toProps())
  assert.equal(rebuilt.getId().getValue(), original.getId().getValue())
  assert.equal(rebuilt.getAdmissionNumber().getValue(), original.getAdmissionNumber().getValue())
  assert.equal(rebuilt.getStatus(), original.getStatus())
})

test('Guardian.reconstitute rebuilds from stored props', () => {
  const guardian = Guardian.create({
    name: 'Mohammad',
    relation: GuardianRelation.FATHER,
    occupation: 'Farmer',
    phoneNumber: PhoneNumber.create('0701234567'),
    tazkiraNumber: TazkiraNumber.create('1234567890'),
  })
  const rebuilt = Guardian.reconstitute(guardian.toProps())
  assert.equal(rebuilt.getName(), 'Mohammad')
  assert.equal(rebuilt.getTazkiraNumber()?.getValue(), '1234567890')
})

})


test('graduate refuses non-active students', () => {
  const s = makeStudent(12)
  s.transferOut('Moving to Paktia province')
  assert.throws(() => s.graduate(), DomainError)
})
