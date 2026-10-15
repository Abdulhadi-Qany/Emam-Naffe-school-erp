import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { db } from '@/lib/db'
import { and, eq, inArray } from 'drizzle-orm'
import { students, grades as gradesTable, sections as sectionsTable, fileUploads } from '@/lib/db/schema'
import type { NextRequest } from 'next/server'
import { ok, badRequest, unprocessable, withV1, audit } from '@/lib/api'

/**
 * Student CSV import.
 * POST /api/students/import { fileUrl }
 * → parses the CSV referenced by an uploaded file, validates rows
 *   (duplicates by admission number), and returns a dry-run summary.
 * Rows are persisted only when `commit=true`.
 */

interface CsvRow {
  admissionNumber: string
  firstName: string
  fatherName: string
  familyName: string
  gradeNumber: string
  sectionName: string
  gender: string
  dateOfBirth: string
}

type StudentInsert = typeof students.$inferInsert

function parseCsv(text: string): { headers: string[]; records: string[][] } {
  const records: string[][] = []
  let record: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      record.push(cell.trim())
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      record.push(cell.trim())
      if (record.some((value) => value !== '')) records.push(record)
      record = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (quoted) throw new Error('The CSV contains an unterminated quoted field')
  record.push(cell.trim())
  if (record.some((value) => value !== '')) records.push(record)

  const [headerRow = [], ...dataRows] = records
  const headers = headerRow.map((header) => header.replace(/^\uFEFF/, '').trim().toLowerCase())
  const requiredHeaders = ['admissionnumber', 'firstname', 'fathername', 'familyname', 'grade', 'section', 'gender', 'dateofbirth']
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`)
  }
  if (new Set(headers).size !== headers.length) throw new Error('CSV headers must not contain duplicates')
  return { headers, records: dataRows }
}

function mapCsvRows(headers: string[], records: string[][]): CsvRow[] {
  const indexOf = (name: string) => headers.indexOf(name)

  return records.map((cells) => {
    return {
      admissionNumber: cells[indexOf('admissionnumber')] ?? '',
      firstName: cells[indexOf('firstname')] ?? '',
      fatherName: cells[indexOf('fathername')] ?? '',
      familyName: cells[indexOf('familyname')] ?? '',
      gradeNumber: cells[indexOf('grade')] ?? '',
      sectionName: cells[indexOf('section')] ?? '',
      gender: (cells[indexOf('gender')] ?? 'male').toLowerCase(),
      dateOfBirth: cells[indexOf('dateofbirth')] ?? '',
    }
  })
}

export async function POST(request: NextRequest) {
  return withV1('students:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const fileUrl = body.fileUrl as string | undefined
    const commit = body.commit === true
    if (!fileUrl) return badRequest('fileUrl is required')

    let storageRef: string
    try {
      const url = new URL(fileUrl, req.url)
      const uploadPrefix = '/api/uploads/'
      if (!url.pathname.startsWith(uploadPrefix)) return badRequest('fileUrl must reference an uploaded file')
      storageRef = decodeURIComponent(url.pathname.slice(uploadPrefix.length))
    } catch {
      return badRequest('fileUrl is invalid')
    }
    const [upload] = await db
      .select()
      .from(fileUploads)
      .where(and(eq(fileUploads.schoolId, schoolId), eq(fileUploads.storageRef, storageRef)))
      .limit(1)
    if (!upload) return badRequest('fileUrl does not reference an uploaded file')

    const content = await readFile(join(process.cwd(), 'storage', storageRef), 'utf8').catch(() => null)
    if (!content) return badRequest('The uploaded file could not be read')

    let parsed: ReturnType<typeof parseCsv>
    try {
      parsed = parseCsv(content)
    } catch (error) {
      return unprocessable(error instanceof Error ? error.message : 'The CSV format is invalid', 'INVALID_CSV')
    }
    const rows = mapCsvRows(parsed.headers, parsed.records)
    if (rows.length === 0) return unprocessable('The CSV has no data rows', 'EMPTY_FILE')
    if (rows.length > 500) return unprocessable('CSV imports are limited to 500 rows', 'TOO_MANY')

    const grades = await db.select({ id: gradesTable.id, level: gradesTable.level }).from(gradesTable).where(eq(gradesTable.schoolId, schoolId))
    const sections = await db.select({ id: sectionsTable.id, gradeId: sectionsTable.gradeId, name: sectionsTable.name }).from(sectionsTable).where(eq(sectionsTable.schoolId, schoolId))
    const gradeByLevel = new Map(grades.map((grade) => [String(grade.level), grade.id]))
    const sectionByName = new Map(sections.map((section) => [`${section.gradeId}:${section.name}`, section.id]))

    const valid: StudentInsert[] = []
    const errors: { row: number; reason: string }[] = []
    const admissionNumbers = [...new Set(rows.map((row) => row.admissionNumber).filter(Boolean))]
    const existingStudents = admissionNumbers.length
      ? await db
          .select({ admissionNumber: students.admissionNumber })
          .from(students)
          .where(inArray(students.admissionNumber, admissionNumbers))
      : []
    const existingAdmissionNumbers = new Set(existingStudents.map((student) => student.admissionNumber))
    const seenAdmissionNumbers = new Set<string>()

    rows.forEach((row, index) => {
      if (!row.firstName || !row.fatherName || !row.familyName || !row.admissionNumber) {
        errors.push({ row: index + 2, reason: 'admissionNumber, firstName, fatherName and familyName are required' })
        return
      }
      if (existingAdmissionNumbers.has(row.admissionNumber) || seenAdmissionNumbers.has(row.admissionNumber)) {
        errors.push({ row: index + 2, reason: `duplicate admission number ${row.admissionNumber}` })
        return
      }
      const gradeId = gradeByLevel.get(row.gradeNumber)
      if (!gradeId) {
        errors.push({ row: index + 2, reason: `unknown grade ${row.gradeNumber}` })
        return
      }
      const sectionId = sectionByName.get(`${gradeId}:${row.sectionName}`)
      if (!sectionId) {
        errors.push({ row: index + 2, reason: `unknown section ${row.sectionName}` })
        return
      }
      if (!['male', 'female'].includes(row.gender)) {
        errors.push({ row: index + 2, reason: "gender must be male or female" })
        return
      }
      const dateOfBirth = new Date(row.dateOfBirth)
      if (!row.dateOfBirth || Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() > Date.now()) {
        errors.push({ row: index + 2, reason: 'invalid dateOfBirth' })
        return
      }

      valid.push({
        id: crypto.randomUUID(),
        schoolId,
        studentId: row.admissionNumber,
        admissionNumber: row.admissionNumber,
        registrationNumber: row.admissionNumber,
        firstName: row.firstName,
        fatherName: row.fatherName,
        familyName: row.familyName,
        fullName: `${row.firstName} ${row.familyName}`,
        dateOfBirth,
        gender: row.gender as 'male' | 'female',
        currentGradeId: gradeId,
        currentSectionId: sectionId,
        enrollmentDate: new Date(),
        status: 'active',
      })
      seenAdmissionNumbers.add(row.admissionNumber)
    })

    let inserted = 0
    if (commit && valid.length > 0) {
      const result = await db.insert(students).values(valid).returning({ id: students.id })
      inserted = result.length
      await audit({
        schoolId,
        userId: user.id,
        action: 'uploaded',
        module: 'students',
        entityType: 'student_import',
        entityId: storageRef,
        changes: { inserted, rejected: errors.length },
      })
    }

    return ok({
      fileUrl,
      totalRows: rows.length,
      validRows: valid.length,
      rejectedRows: errors.length,
      inserted,
      committed: commit,
      errors: errors.slice(0, 50),
    })
  })(request)
}
