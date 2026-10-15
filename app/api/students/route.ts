import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { students, studentGuardians, studentDocuments, studentHealthRecords, studentSpecialCategories, grades, sections } from '@/lib/db/schema'
import { eq, and, or, ilike, desc, asc, count, sql } from 'drizzle-orm'
import { generateAdmissionNumber } from '@/lib/utils/afghanistan'
import { audit, paged, parsePagination, withV1 } from '@/lib/api'

export async function GET(request: NextRequest) {
  return withV1('students:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const grade = searchParams.get('grade')
    const section = searchParams.get('section')
    const status = searchParams.get('status')
    const query = searchParams.get('query')
    const conditions = [eq(students.schoolId, schoolId)]
    if (grade) conditions.push(eq(students.currentGradeId, grade))
    if (section) conditions.push(eq(students.currentSectionId, section))
    if (status) conditions.push(eq(students.status, status as never))
    if (query) {
      const pattern = `%${query}%`
      conditions.push(or(
        ilike(students.firstName, pattern),
        ilike(students.fatherName, pattern),
        ilike(students.familyName, pattern),
        ilike(students.fullName, pattern),
        ilike(students.admissionNumber, pattern),
        ilike(students.registrationNumber, pattern),
        ilike(students.nationalId, pattern)
      )!)
    }
    const where = and(...conditions)
    const [totalResult] = await db.select({ count: count() }).from(students).where(where)
    const rows = await db
      .select({
        student: students,
        grade: grades.level,
        sectionName: sections.name,
        primaryGuardianMobile: sql<string | null>`(
          select ${studentGuardians.mobile}
          from ${studentGuardians}
          where ${studentGuardians.studentId} = ${students.id}
            and ${studentGuardians.isPrimary} = true
          limit 1
        )`,
      })
      .from(students)
      .leftJoin(grades, eq(students.currentGradeId, grades.id))
      .leftJoin(sections, eq(students.currentSectionId, sections.id))
      .where(where)
      .orderBy(desc(students.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows.map(({ student, grade, sectionName, primaryGuardianMobile }) => ({
      ...student,
      grade,
      section: sectionName,
      fatherMobile: student.fatherMobile ?? primaryGuardianMobile,
    })), pagination, totalResult?.count ?? 0)
  })(request)
}

const ADMISSION_DOCUMENT_TYPES: Record<string, string> = {
  tazkira: 'tazkira',
  'birth certificate': 'birth_certificate',
  reportCard: 'report_card',
  'transfer certificate': 'transfer_certificate',
  vaccinationCard: 'vaccination_card',
  passportPhotos: 'passport_photo',
  'father tazkira': 'father_tazkira',
  'guardian tazkira': 'guardian_tazkira',
} as const

const VALID_SPECIAL_CATEGORIES = ['orphan', 'returned_refugee', 'idp', 'kuchi', 'disability', 'martyrs_child', 'low_income', 'sibling_in_school'] as const

type SpecialCategory = (typeof VALID_SPECIAL_CATEGORIES)[number]

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

export async function POST(request: NextRequest) {
  return withV1('students:write', async ({ schoolId, user }, req) => {
  try {
    const body = await req.json?.() ?? {}
    const errs: string[] = []

    // ---- 2.1.1 Personal Information ----
    const firstName = isNonEmptyString(body.firstName) ? body.firstName.trim() : ''
    const fatherName = isNonEmptyString(body.fatherName) ? body.fatherName.trim() : ''
    const familyName = isNonEmptyString(body.familyName) ? body.familyName.trim() : ''
    const dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth as string) : null
    const gender = body.gender
    const nationality = isNonEmptyString(body.nationality) ? body.nationality.trim() : 'Afghan'
    const bloodGroup = isNonEmptyString(body.bloodGroup) ? body.bloodGroup.trim() : ''
    const religion = isNonEmptyString(body.religion) ? body.religion.trim() : 'Islam'
    const motherTongue = isNonEmptyString(body.motherTongue) ? body.motherTongue.trim() : 'Dari'
    const ethnicity = isNonEmptyString(body.ethnicity) ? body.ethnicity.trim() : ''

    if (!firstName) errs.push('firstName is required')
    if (!fatherName) errs.push('fatherName is required')
    if (!familyName) errs.push('familyName is required')
    if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime())) errs.push('dateOfBirth is required (ISO date)')
    if (!gender) errs.push('gender is required')

    // ---- Guardian (2.1.1) ----
    const guardian = body.guardian || {}
    const guardianName = isNonEmptyString(guardian.name) ? guardian.name.trim() : ''
    const guardianRelation = isNonEmptyString(guardian.relation) ? guardian.relation.trim() : 'parent'
    const guardianMobile = isNonEmptyString(guardian.mobile) ? guardian.mobile.trim() : ''
    if (!guardianName) errs.push('guardian.name is required')

    // ---- Contact (2.1.1) ----
    const phone = isNonEmptyString(body.phone) ? body.phone.trim() : ''
    const email = isNonEmptyString(body.email) ? body.email.trim() : ''
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.push('email must be a valid email address')

    // ---- Address (2.1.1) ----
    const currentProvince = isNonEmptyString(body.currentProvince) ? body.currentProvince.trim() : ''
    const currentDistrict = isNonEmptyString(body.currentDistrict) ? body.currentDistrict.trim() : ''
    const currentArea = isNonEmptyString(body.currentArea) ? body.currentArea.trim() : ''
    if (!currentProvince) errs.push('currentProvince is required')

    // ---- Special categories (2.1.1) ----
    const specialCategories = Array.isArray(body.specialCategories)
      ? body.specialCategories.filter((c: unknown) => isNonEmptyString(c))
      : []
    const invalidCategories = specialCategories.filter((c: string) => !VALID_SPECIAL_CATEGORIES.includes(c as SpecialCategory))
    if (invalidCategories.length > 0) errs.push(`Invalid specialCategories: ${invalidCategories.join(', ')}`)

    // ---- Health (2.1.1) ----
    const chronicIllness = isNonEmptyString(body.chronicIllness) ? body.chronicIllness.trim() : ''
    const allergies = isNonEmptyString(body.allergies) ? body.allergies.trim() : ''
    const vaccinations = isNonEmptyString(body.vaccinations) ? body.vaccinations.trim() : ''

    // ---- Documents (2.1.1) ----
    const documents = Array.isArray(body.documents)
      ? body.documents.filter((d: { type?: string; url?: string }) => isNonEmptyString(d.type) && isNonEmptyString(d.url))
      : []
    const seenTypes: string[] = []
    for (const doc of documents) {
      const canonical = ADMISSION_DOCUMENT_TYPES[doc.type]
      if (canonical === undefined) {
        errs.push(`Unknown document type: ${doc.type}`)
        continue
      }
      if (seenTypes.includes(canonical)) errs.push(`Duplicate document type: ${doc.type}`)
      else seenTypes.push(canonical)
    }
    if (!documents.some((d: { type: string }) => d.type === 'tazkira')) errs.push('tazkira copy is required')
    if (!documents.some((d: { type: string }) => d.type === 'passportPhotos')) errs.push('4 passport photos are required')
    if (!documents.some((d: { type: string }) => d.type === 'father tazkira')) errs.push("father's tazkira copy is required")

    if (errs.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errs }, { status: 400 })
    }

    if (body.currentGradeId) {
      const [gradeRow] = await db.select({ id: grades.id }).from(grades).where(and(
        eq(grades.id, String(body.currentGradeId)),
        eq(grades.schoolId, schoolId)
      )).limit(1)
      if (!gradeRow) return NextResponse.json({ error: 'currentGradeId is not a grade in this school' }, { status: 400 })
    }
    if (body.currentSectionId) {
      const [sectionRow] = await db.select({ id: sections.id }).from(sections).where(and(
        eq(sections.id, String(body.currentSectionId)),
        eq(sections.schoolId, schoolId)
      )).limit(1)
      if (!sectionRow) return NextResponse.json({ error: 'currentSectionId is not a section in this school' }, { status: 400 })
    }

    // ---- 2.1.3 Admission number ----
    const academicYear = parseInt(String(body.academicYear || new Date().getFullYear()), 10)
    const grade = String(body.grade || '1')
    const sequence = body.sequence ?? Math.floor(Math.random() * 10000)
    const admissionNumber = generateAdmissionNumber(academicYear, Number(grade), sequence)
    const [dup] = await db.select({ count: count() }).from(students).where(and(
      eq(students.schoolId, schoolId),
      eq(students.admissionNumber, admissionNumber)
    ))
    if (dup?.count) {
      return NextResponse.json({ error: 'Admission number already exists', code: admissionNumber }, { status: 409 })
    }

    const createdStudent = await db.transaction(async (tx) => {
      const [newStudent] = await tx.insert(students).values({
        id: crypto.randomUUID(),
        schoolId,
        studentId: `STU-${Date.now()}`,
        registrationNumber: isNonEmptyString(body.registrationNumber) ? body.registrationNumber : `REG-${Date.now()}`,
        admissionNumber,
        firstName,
        fatherName,
        grandfatherName: isNonEmptyString(body.grandfatherName) ? body.grandfatherName.trim() : null,
        familyName,
        fullName: `${firstName} ${familyName}`,
        dateOfBirth: dateOfBirth as Date,
        gender,
        bloodGroup: bloodGroup || null,
        nationality,
        nationalId: body.nationalId,
        photo: body.photo,
        address: [currentDistrict, currentArea].filter(Boolean).join(', ') || (isNonEmptyString(body.address) ? body.address : null),
        city: isNonEmptyString(body.city) ? body.city : currentDistrict || null,
        province: currentProvince || (isNonEmptyString(body.province) ? body.province : null),
        country: isNonEmptyString(body.country) ? body.country : 'Afghanistan',
        phone,
        email,
        religion,
        fatherMobile: guardianMobile || null,
        currentGradeId: body.currentGradeId,
        currentSectionId: body.currentSectionId,
        enrollmentDate: new Date(body.enrollmentDate || Date.now()),
        status: body.status || 'active',
      }).returning()

      await tx.insert(studentGuardians).values({
        id: crypto.randomUUID(),
        studentId: newStudent.id,
        name: guardianName,
        relationship: guardianRelation,
        mobile: guardianMobile,
      })

      for (const doc of documents) {
        await tx.insert(studentDocuments).values({
          id: crypto.randomUUID(),
          studentId: newStudent.id,
          documentType: ADMISSION_DOCUMENT_TYPES[doc.type] || doc.type,
          title: doc.title || doc.type,
          fileUrl: doc.url,
          status: 'verified',
        })
      }

      if (chronicIllness || allergies || vaccinations) {
        await tx.insert(studentHealthRecords).values({
          id: crypto.randomUUID(),
          studentId: newStudent.id,
          condition: chronicIllness || null,
          allergy: allergies || null,
          notes: vaccinations ? `Vaccinations: ${vaccinations}` : null,
        })
      }

      for (const cat of specialCategories) {
        await tx.insert(studentSpecialCategories).values({
          id: crypto.randomUUID(),
          studentId: newStudent.id,
          category: cat,
          startDate: new Date(),
        })
      }

      return {
        ...newStudent,
        documents: documents.map((d: { type: string; url: string }) => ({ type: d.type, url: d.url })),
        guardian: { name: guardianName, relation: guardianRelation, mobile: guardianMobile },
      }
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'students',
      entityType: 'student',
      entityId: createdStudent.id,
    })

    return NextResponse.json(createdStudent, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
  }
  })(request)
}
