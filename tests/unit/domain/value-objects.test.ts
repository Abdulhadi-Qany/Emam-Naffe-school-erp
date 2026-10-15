import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  StudentId,
  AdmissionNumber,
  TazkiraNumber,
  PhoneNumber,
  Email,
  GradeLevel,
  Section,
  Money,
  DateOfBirth,
} from '@/src/domain'
import { DomainError } from '@/src/domain'

test('StudentId.generate produces a valid UUID', () => {
  const id = StudentId.generate()
  assert.match(id.getValue(), /^[0-9a-f-]{36}$/i)
})

test('StudentId.fromString rejects empty and malformed values', () => {
  assert.throws(() => StudentId.fromString(''), DomainError)
  assert.throws(() => StudentId.fromString('not-a-uuid'), DomainError)
})

test('AdmissionNumber.create builds the EBPS-year-grade-sequence format', () => {
  const an = AdmissionNumber.create(1403, 'G1', 45)
  assert.equal(an.getValue(), 'EBPS-1403-G1-0045')
  assert.equal(an.getYear(), 1403)
  assert.equal(an.getGrade(), 'G1')
  assert.equal(an.getSequence(), 45)
})

test('AdmissionNumber normalizes KG and rejects bad sequences/years', () => {
  assert.equal(AdmissionNumber.create(1403, 'KG', 1).getGrade(), 'KG')
  assert.throws(() => AdmissionNumber.create(1200, 'G1', 1), DomainError)
  assert.throws(() => AdmissionNumber.create(1403, 'G1', 0), DomainError)
  assert.throws(() => AdmissionNumber.fromString('EBPS-1403-G13-0001'), DomainError)
})

test('TazkiraNumber accepts electronic (13-digit) and paper formats', () => {
  assert.equal(TazkiraNumber.create('1234567890123').isElectronic(), true)
  assert.equal(TazkiraNumber.create('ABC-12345').isElectronic(), false)
  assert.throws(() => TazkiraNumber.create('12'), DomainError)
})

test('PhoneNumber normalizes Afghan formats and detects provider', () => {
  assert.equal(PhoneNumber.create('0701234567').getValue(), '+93701234567')
  assert.equal(PhoneNumber.create('+93701234567').getValue(), '+93701234567')
  assert.equal(PhoneNumber.create('0701234567').getProvider(), 'Roshan')
  assert.equal(PhoneNumber.create('0741234567').getProvider(), 'MTN')
  assert.throws(() => PhoneNumber.create('12345'), DomainError)
})

test('Email validates format', () => {
  assert.equal(Email.create('Ahmad@Example.com').getValue(), 'ahmad@example.com')
  assert.throws(() => Email.create('not-an-email'), DomainError)
})

test('GradeLevel enforces range and computes codes/types', () => {
  assert.throws(() => GradeLevel.create(13), DomainError)
  assert.throws(() => GradeLevel.create(-1), DomainError)
  assert.equal(GradeLevel.create(0).getCode(), 'KG')
  assert.equal(GradeLevel.create(5).getCode(), 'G5')
  assert.equal(GradeLevel.create(0).getType(), 'KG')
  assert.equal(GradeLevel.create(8).getType(), 'SECONDARY')
  assert.equal(GradeLevel.create(11).next().getGrade(), 12)
  assert.throws(() => GradeLevel.create(12).next(), DomainError)
})

test('Section requires a single letter', () => {
  assert.equal(Section.create('a').getValue(), 'A')
  assert.throws(() => Section.create('AB'), DomainError)
})

test('Money supports arithmetic and rejects negatives', () => {
  const a = Money.fromAFN(1000)
  const b = Money.fromAFN(250)
  assert.equal(a.subtract(b).getAmount(), 750)
  assert.equal(a.add(b).getAmount(), 1250)
  assert.equal(a.percentage(25).getAmount(), 250)
  assert.throws(() => a.subtract(Money.fromAFN(2000)), DomainError)
  assert.throws(() => Money.fromAFN(-1), DomainError)
})

test('DateOfBirth computes age, school-age and dual calendar', () => {
  const dob = DateOfBirth.fromGregorian(new Date('2015-01-01'))
  assert.ok(dob.getAgeInYears() >= 9)
  assert.ok(dob.getSolarHijri().year > 1390)
  assert.throws(() => DateOfBirth.fromGregorian(new Date('2999-01-01')), DomainError)
})
