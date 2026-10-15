import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Address } from '@/src/domain/entities/Address'
import { Guardian } from '@/src/domain/entities/Guardian'
import { HealthRecord } from '@/src/domain/entities/HealthRecord'
import { DomainError } from '@/src/domain/errors/DomainError'
import { PhoneNumber } from '@/src/domain/value-objects/PhoneNumber'
import { TazkiraNumber } from '@/src/domain/value-objects/TazkiraNumber'
import { GuardianRelation } from '@/src/domain/enums/GuardianRelation'
import { StudentId } from '@/src/domain/value-objects/StudentId'
import { AdmissionNumber } from '@/src/domain/value-objects/AdmissionNumber'
import { StudentEnrolledEvent } from '@/src/domain/events/StudentEnrolledEvent'

// ─── Address ────────────────────────────────────────────────────────────────

test('Address.create builds a trimmed address with fullAddress formatting', () => {
  const addr = Address.create({
    province: '  Kabul  ',
    district: 'District 5',
    village: 'Karte Naw',
    houseNumber: '12',
  })
  assert.equal(addr.getProvince(), 'Kabul')
  assert.equal(addr.getFullAddress(), '12, Karte Naw, District 5, Kabul')
})

test('Address.create rejects missing province/district/village', () => {
  assert.throws(() => Address.create({ province: '', district: 'D', village: 'V' }), DomainError)
  assert.throws(() => Address.create({ province: 'K', district: '', village: 'V' }), DomainError)
  assert.throws(() => Address.create({ province: 'K', district: 'D', village: '' }), DomainError)
})

test('Address.equals compares by core fields (ignores landmark)', () => {
  const a1 = Address.create({ province: 'Kabul', district: 'District 4', village: 'Karte Seh', landmark: 'X' })
  const a2 = Address.create({ province: 'Kabul', district: 'District 4', village: 'Karte Seh', landmark: 'Y' })
  const a3 = Address.create({ province: 'Herat', district: 'District 4', village: 'Karte Seh' })
  assert.equal(a1.equals(a2), true)
  assert.equal(a1.equals(a3), false)
})

// ─── Guardian ───────────────────────────────────────────────────────────────

test('Guardian.create validates name and occupation', () => {
  const phone = PhoneNumber.create('0701234567')
  assert.throws(
    () => Guardian.create({ name: 'A', relation: GuardianRelation.FATHER, occupation: 'Farmer', phoneNumber: phone }),
    DomainError
  )
  assert.throws(
    () => Guardian.create({ name: 'Ali', relation: GuardianRelation.FATHER, occupation: '', phoneNumber: phone }),
    DomainError
  )
})

test('Guardian mutations update name, phone and address', () => {
  const guardian = Guardian.create({
    name: 'Mohammad',
    relation: GuardianRelation.FATHER,
    occupation: 'Farmer',
    phoneNumber: PhoneNumber.create('0701234567'),
    tazkiraNumber: TazkiraNumber.create('1234567890'),
  })
  guardian.updateName('  Abdullah  ')
  guardian.updatePhoneNumber(PhoneNumber.create('0787654321'))
  guardian.updateAddress(Address.create({ province: 'Kabul', district: 'District 4', village: 'Karte Seh' }))

  assert.equal(guardian.getName(), 'Abdullah')
  assert.equal(guardian.getPhoneNumber().getValue(), '+93787654321')
  assert.equal(guardian.getAddress()?.getProvince(), 'Kabul')
})

test('Guardian.updateName rejects short names', () => {
  const guardian = Guardian.create({
    name: 'Mohammad',
    relation: GuardianRelation.FATHER,
    occupation: 'Farmer',
    phoneNumber: PhoneNumber.create('0701234567'),
  })
  assert.throws(() => guardian.updateName('A'), DomainError)
})

// ─── HealthRecord ───────────────────────────────────────────────────────────

test('HealthRecord.create validates emergency contact and vaccination status', () => {
  assert.throws(
    () =>
      HealthRecord.create({
        vaccinationStatus: 'Complete',
        emergencyContactName: '',
        emergencyContactNumber: '0701234567',
      }),
    DomainError
  )
  assert.throws(
    () =>
      HealthRecord.create({
        vaccinationStatus: 'Complete',
        emergencyContactName: 'Ali',
        emergencyContactNumber: '123',
      }),
    DomainError
  )
  assert.throws(
    () =>
      HealthRecord.create({
        vaccinationStatus: '',
        emergencyContactName: 'Ali',
        emergencyContactNumber: '0701234567',
      }),
    DomainError
  )
})

test('HealthRecord.update changes provided fields and bumps lastUpdated', async () => {
  const record = HealthRecord.create({
    vaccinationStatus: 'Complete',
    emergencyContactName: 'Ali',
    emergencyContactNumber: '0701234567',
    allergies: ['Peanuts'],
  })
  const before = record.getLastUpdated()
  await new Promise((r) => setTimeout(r, 5))
  record.update({ chronicIllness: 'Asthma', allergies: ['Dust'] })

  assert.equal(record.getChronicIllness(), 'Asthma')
  assert.deepEqual(record.getAllergies(), ['Dust'])
  assert.ok(record.getLastUpdated().getTime() > before.getTime())
})

test('HealthRecord.getAllergies returns a defensive copy', () => {
  const record = HealthRecord.create({
    vaccinationStatus: 'Complete',
    emergencyContactName: 'Ali',
    emergencyContactNumber: '0701234567',
    allergies: ['Peanuts'],
  })
  record.getAllergies().push('Mutated')
  assert.deepEqual(record.getAllergies(), ['Peanuts'])
})

// ─── Domain events ──────────────────────────────────────────────────────────

test('StudentEnrolledEvent carries student id, admission number and timestamp', () => {
  const studentId = StudentId.generate()
  const admissionNumber = AdmissionNumber.create(1403, 'G1', 1)
  const event = new StudentEnrolledEvent(studentId, admissionNumber)

  assert.equal(event.eventName, 'StudentEnrolled')
  assert.equal(event.aggregateId, studentId.getValue())
  assert.equal(event.admissionNumber.getValue(), admissionNumber.getValue())
  assert.ok(event.occurredAt instanceof Date)
})
