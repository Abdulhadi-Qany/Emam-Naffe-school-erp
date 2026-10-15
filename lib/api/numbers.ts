/**
 * Business-number generators.
 *
 * Every public-facing number (admission, employee, invoice, receipt, expense)
 * is allocated through `number_sequences` so concurrent requests can never
 * produce duplicates — replacing the previous `count(*)`-based approaches.
 */

import {
  generateAdmissionNumber as formatAdmissionNumber,
  generateEmployeeId,
  generateInvoiceNumber,
  generateReceiptNumber,
} from '@/lib/utils/afghanistan'
import { afghanAcademicYear } from './time'
import { formatSequence, nextInSequence, type SequenceExecutor } from './sequence'

export async function admissionNumber(schoolId: string, grade: number, executor?: SequenceExecutor): Promise<string> {
  const academicYear = afghanAcademicYear(new Date())
  const sequence = await nextInSequence(`admission-${academicYear}`, schoolId, executor)
  return formatAdmissionNumber(academicYear, grade, sequence)
}

export async function employeeCode(schoolId: string, executor?: SequenceExecutor): Promise<string> {
  const academicYear = afghanAcademicYear(new Date())
  const sequence = await nextInSequence(`employee-${academicYear}`, schoolId, executor)
  return generateEmployeeId(academicYear, sequence)
}

export async function invoiceNumber(schoolId: string, executor?: SequenceExecutor): Promise<string> {
  const academicYear = afghanAcademicYear(new Date())
  const sequence = await nextInSequence(`invoice-${academicYear}`, schoolId, executor)
  return generateInvoiceNumber(academicYear, sequence)
}

export async function receiptNumber(schoolId: string, executor?: SequenceExecutor): Promise<string> {
  const academicYear = afghanAcademicYear(new Date())
  const sequence = await nextInSequence(`receipt-${academicYear}`, schoolId, executor)
  return generateReceiptNumber(academicYear, sequence)
}

/** Generic prefixed numbers (expenses, assets, work orders, …). */
export async function prefixedNumber(
  prefix: string,
  schoolId: string,
  executor?: SequenceExecutor,
  options: { padTo?: number; scopedPerYear?: boolean } = {}
): Promise<string> {
  const padTo = options.padTo ?? 4
  const academicYear = afghanAcademicYear(new Date())
  const key = options.scopedPerYear === false ? prefix : `${prefix}-${academicYear}`
  const sequence = await nextInSequence(key, schoolId, executor)
  return formatSequence(sequence, prefix, padTo)
}

export const businessNumbers = {
  admissionNumber,
  employeeCode,
  invoiceNumber,
  receiptNumber,
  prefixedNumber,
}
