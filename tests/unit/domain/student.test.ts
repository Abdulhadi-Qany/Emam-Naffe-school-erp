import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  Student,
  Address,
  StudentId,
  AdmissionNumber,
  PhoneNumber,
  DateOfBirth,
  GradeLevel,
  Section,
  Money,
  Gender,
  BloodGroup,
  SpecialCategory,
} from '@/src/domain'
import { DomainError } from '@/src/domain'

function makeStudent(grade = 1) {
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
    dateOfBirth: DateOfBirth.fromGregorian(new Date('2015-01-01')),
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
  })
}

test('enroll creates an ACTIVE student and emits StudentEnrolledEvent', () => {
  const student = makeStudent()
  assert.equal(student.getStatus(), 'active')
  assert.equal(student.getFullNameEnglish(), 'Ahmad Ahmadi')
  const events = student.pullDomainEvents()
  assert.equal(events.length, 1)
  assert.equal(events[0].eventName, 'StudentEnrolled')
})

test('enroll rejects out-of-school-age unless explicitly allowed', () => {
  assert.throws(
    () =>
      Student.enroll({
        id: StudentId.generate(),
        schoolId: 'EBPS-KABUL-01',
        admissionNumber: AdmissionNumber.create(1403, 'G1', 1),
        firstNameDari: 'احمد',
        lastNameDari: 'احمدی',
        firstNamePashto: 'احمد',
        lastNamePashto: 'احمدي',
        firstNameEnglish: 'Ahmad',
        lastNameEnglish: 'Ahmadi',
        fatherName: 'Mohammad',
        grandfatherName: 'Abdullah',
        motherName: 'Fatima',
        dateOfBirth: DateOfBirth.fromGregorian(new Date('1980-01-01')),
        gender: Gender.MALE,
        bloodGroup: BloodGroup.UNKNOWN,
        nationality: 'Afghan',
        motherTongue: 'Dari',
        sect: 'Sunni',
        currentAddress: Address.create({ province: 'Kabul', district: 'D', village: 'V' }),
        permanentAddress: Address.create({ province: 'Kabul', district: 'D', village: 'V' }),
        fatherPhone: PhoneNumber.create('0701234567'),
        gradeLevel: GradeLevel.create(1),
        section: Section.create('A'),
        admissionDate: new Date(),
      }),
    DomainError
  )
})

test('promoteTo advances exactly one grade and emits StudentPromotedEvent', () => {
  const student = makeStudent(1)
  student.pullDomainEvents()
  student.promoteTo(GradeLevel.create(2), Section.create('B'))
  assert.equal(student.getGradeLevel().getGrade(), 2)
  assert.equal(student.getSection().getValue(), 'B')
  const events = student.pullDomainEvents()
  assert.equal(events[0].eventName, 'StudentPromoted')
})

test('promoteTo rejects skipping a grade', () => {
  const student = makeStudent(1)
  assert.throws(() => student.promoteTo(GradeLevel.create(3), Section.create('A')), DomainError)
})

test('transferOut and markAsDroppedOut require a reason of 5+ chars', () => {
  const s1 = makeStudent()
  assert.throws(() => s1.transferOut('abc'), DomainError)
  s1.transferOut('Relocating to Herat')
  assert.equal(s1.getStatus(), 'transferred')

  const s2 = makeStudent()
  assert.throws(() => s2.markAsDroppedOut('no'), DomainError)
  s2.markAsDroppedOut('Family could not afford fees')
  assert.equal(s2.getStatus(), 'dropped_out')
})

test('graduate only from grade 12', () => {
  const s = makeStudent(12)
  s.graduate()
  assert.equal(s.getStatus(), 'graduated')
  const s2 = makeStudent(5)
  assert.throws(() => s2.graduate(), DomainError)
})

test('fee waiver requires reason and calculates discounted fee', () => {
  const s = makeStudent()
  assert.throws(() => s.applyFeeWaiver(150, 'reason text'), DomainError)
  assert.throws(() => s.applyFeeWaiver(50, 'no'), DomainError)
  s.applyFeeWaiver(25, 'Low income family')
  assert.equal(s.getFeeWaiverPercentage(), 25)
  assert.equal(s.calculateFeeAfterWaiver(Money.fromAFN(1000)).getAmount(), 750)
})

test('special categories can be added/removed and queried', () => {
  const s = makeStudent()
  s.addSpecialCategory(SpecialCategory.ORPHAN)
  assert.equal(s.hasSpecialCategory(SpecialCategory.ORPHAN), true)
  s.removeSpecialCategory(SpecialCategory.ORPHAN)
  assert.equal(s.hasSpecialCategory(SpecialCategory.ORPHAN), false)
})
