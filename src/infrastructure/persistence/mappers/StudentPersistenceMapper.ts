import type { StudentProps } from '@/src/domain/entities'
import {
  Student,
  StudentDocument,
  StudentId,
  AdmissionNumber,
  TazkiraNumber,
  PhoneNumber,
  Email,
  DateOfBirth,
  GradeLevel,
  Section,
  Gender,
  BloodGroup,
  SpecialCategory,
  GuardianRelation,
  StudentStatus,
  Address,
  Guardian,
  HealthRecord,
} from '@/src/domain'

/** Shape of a joined student row produced by the repository. */
export interface StudentRow {
  student: Record<string, unknown>
  guardian?: Record<string, unknown> | null
  documents: Record<string, unknown>[]
  specialCategories: string[]
  health?: Record<string, unknown> | null
  /** Resolved from `grades.level` by the repository (undefined for legacy rows). */
  gradeLevel?: number
  /** Resolved from `sections.name` by the repository (undefined for legacy rows). */
  sectionName?: string
}

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
const toDate = (v: unknown): Date => (v instanceof Date ? v : new Date(v as string))

const GRADE_TOKEN = /-(KG|G(\d{1,2}))-/i

/**
 * Grade level for a persisted student: prefers the repository-resolved
 * `grades.level`, falls back to the grade encoded in the admission number
 * (`EBPS-1403-G5-0042` → 5, `…-KG-…` → 0), else grade 1.
 */
const resolveGradeLevel = (row: StudentRow): number => {
  if (typeof row.gradeLevel === 'number' && Number.isInteger(row.gradeLevel)) return row.gradeLevel
  const admission = str(row.student.admissionNumber)
  const match = admission?.match(GRADE_TOKEN)
  if (match) return match[1].toUpperCase() === 'KG' ? 0 : Number(match[2])
  return 1
}

/**
 * Maps between the Student domain aggregate and Drizzle/Postgres rows.
 * Lives in the infrastructure layer — the only place that knows about the DB.
 */
export class StudentPersistenceMapper {
  public static toDomain(row: StudentRow): Student {
    const s = row.student as Record<string, never>
    const g = row.guardian as Record<string, unknown> | null | undefined
    const h = row.health as Record<string, unknown> | null | undefined

    const currentAddress = Address.reconstitute({
      province: str(s.address) || 'Unknown',
      district: str(s.city) || 'Unknown',
      village: str(s.city) || 'Unknown',
    })
    const permanentAddress = Address.reconstitute({
      province: str(s.province) || 'Unknown',
      district: str(s.city) || 'Unknown',
      village: str(s.city) || 'Unknown',
    })

    let guardian: Guardian | undefined
    if (g && str(g.name)) {
      guardian = Guardian.reconstitute({
        name: str(g.name) as string,
        relation: (str(g.relationship) as GuardianRelation) || GuardianRelation.OTHER,
        occupation: str(g.occupation) || 'Unknown',
        tazkiraNumber: str(g.tazkiraNumber) ? TazkiraNumber.create(str(g.tazkiraNumber) as string) : undefined,
        phoneNumber: PhoneNumber.create(str(g.mobile) || '0700000000'),
      })
    }

    let healthRecord: HealthRecord | undefined
    if (h) {
      healthRecord = HealthRecord.reconstitute({
        chronicIllness: str(h.condition),
        allergies: str(h.allergy) ? [str(h.allergy) as string] : [],
        medications: str(h.medication) ? [str(h.medication) as string] : [],
        vaccinationStatus: str(h.notes) || 'Not specified',
        specialNeeds: str(h.notes),
        emergencyContactName: str(h.physicianName) || 'Not provided',
        emergencyContactNumber: str(h.physicianPhone) || '0000000000',
        lastUpdated: toDate(s.updatedAt),
      })
    }

    const documents: StudentDocument[] = (row.documents || []).map((d) =>
      StudentDocument.create({
        id: str(d.id) as string,
        type: str(d.documentType) as string,
        fileName: str(d.title) as string,
        fileUrl: str(d.fileUrl) as string,
        uploadedAt: toDate(d.uploadedAt),
        verified: str(d.status) === 'verified',
      })
    )

    const specialCategories = (row.specialCategories || []) as SpecialCategory[]

    const props: StudentProps = {
      id: StudentId.fromString(str(s.id) as string),
      schoolId: str(s.schoolId) as string,
      admissionNumber: AdmissionNumber.fromString(str(s.admissionNumber) as string),
      firstNameDari: str(s.firstName) as string,
      lastNameDari: str(s.familyName) as string,
      firstNamePashto: str(s.firstName) as string,
      lastNamePashto: str(s.familyName) as string,
      firstNameEnglish: str(s.firstName) as string,
      lastNameEnglish: str(s.familyName) as string,
      fatherName: str(s.fatherName) as string,
      grandfatherName: str(s.grandfatherName) || '',
      motherName: 'Unknown',
      dateOfBirth: DateOfBirth.fromGregorian(toDate(s.dateOfBirth)),
      gender: (str(s.gender) as Gender) || Gender.OTHER,
      tazkiraNumber: str(s.nationalId) ? TazkiraNumber.create(str(s.nationalId) as string) : undefined,
      bloodGroup: (str(s.bloodGroup) as BloodGroup) || BloodGroup.UNKNOWN,
      nationality: str(s.nationality) || 'Afghan',
      motherTongue: 'Dari',
      sect: str(s.religion) || 'Islam',
      email: str(s.email) ? Email.create(str(s.email) as string) : undefined,
      currentAddress,
      permanentAddress,
      phoneNumber: str(s.phone) ? PhoneNumber.create(str(s.phone) as string) : undefined,
      fatherPhone: str(s.fatherMobile)
        ? PhoneNumber.create(str(s.fatherMobile) as string)
        : guardian
          ? guardian.getPhoneNumber()
          : PhoneNumber.create('0700000000'),
      motherPhone: undefined,
      guardian,
      gradeLevel: GradeLevel.create(resolveGradeLevel(row)),
      section: Section.create(row.sectionName || 'A'),
      rollNumber: undefined,
      admissionDate: toDate(s.enrollmentDate),
      enrollmentDate: toDate(s.enrollmentDate),
      status: (str(s.status) as StudentStatus) || StudentStatus.ACTIVE,
      healthRecord,
      specialCategories,
      disabilityType: undefined,
      previousSchool: undefined,
      previousGrade: undefined,
      photoUrl: str(s.photo),
      documents,
      feeWaiverPercentage: 0,
      scholarshipId: undefined,
      createdAt: toDate(s.createdAt),
      updatedAt: toDate(s.updatedAt),
    }

    return Student.reconstitute(props)
  }

  /** Domain aggregate → `students` table insert/update values. */
  public static toStudentRow(student: Student): Record<string, unknown> {
    const dob = student.getDateOfBirth()
    const current = student.getCurrentAddress()
    return {
      id: student.getId().getValue(),
      schoolId: student.getSchoolId(),
      studentId: `STU-${Date.now()}-${student.getId().getValue().slice(0, 8)}`,
      registrationNumber: `REG-${Date.now()}`,
      admissionNumber: student.getAdmissionNumber().getValue(),
      firstName: student.getFirstNameEnglish(),
      fatherName: student.getFatherName(),
      grandfatherName: student.getGrandfatherName() || null,
      familyName: student.getLastNameEnglish(),
      fullName: student.getFullNameEnglish(),
      dateOfBirth: dob.getGregorian(),
      placeOfBirth: null,
      gender: student.getGender(),
      bloodGroup: student.getBloodGroup(),
      nationality: student.getNationality(),
      nationalId: student.getTazkiraNumber()?.getValue() ?? null,
      photo: student.getPhotoUrl() ?? null,
      address: current.getFullAddress(),
      city: current.getDistrict(),
      province: current.getProvince(),
      country: 'Afghanistan',
      phone: student.getPhoneNumber()?.getValue() ?? null,
      fatherMobile: student.getFatherPhone()?.getValue() ?? null,
      email: student.getEmail()?.getValue() ?? null,
      religion: student.getSect(),
      currentGradeId: null,
      currentSectionId: null,
      enrollmentDate: student.getEnrollmentDate(),
      status: student.getStatus(),
    }
  }

  /** Domain guardian → `student_guardians` insert values. */
  public static toGuardianRow(studentId: string, guardian: Guardian): Record<string, unknown> {
    return {
      id: crypto.randomUUID(),
      studentId,
      userId: null,
      name: guardian.getName(),
      relationship: guardian.getRelation(),
      mobile: guardian.getPhoneNumber().getValue(),
      phone: null,
      email: null,
      occupation: guardian.getOccupation(),
      tazkiraNumber: guardian.getTazkiraNumber()?.getValue() ?? null,
      nationalId: null,
      isPrimary: true,
    }
  }

  /** Domain document → `student_documents` insert values. */
  public static toDocumentRow(studentId: string, doc: StudentDocument): Record<string, unknown> {
    return {
      id: doc.getId(),
      studentId,
      documentType: doc.getType(),
      title: doc.getFileName(),
      fileUrl: doc.getFileUrl(),
      status: doc.isVerified() ? 'verified' : 'pending',
    }
  }

  /** Special category → `student_special_categories` insert values. */
  public static toSpecialCategoryRow(studentId: string, category: SpecialCategory): Record<string, unknown> {
    return {
      id: crypto.randomUUID(),
      studentId,
      category,
      description: null,
      startDate: new Date(),
      endDate: null,
    }
  }

  /** Health record → `student_health_records` insert values. */
  public static toHealthRow(studentId: string, health: HealthRecord): Record<string, unknown> {
    return {
      id: crypto.randomUUID(),
      studentId,
      condition: health.getChronicIllness() ?? null,
      allergy: health.getAllergies().join(', ') || null,
      medication: health.getMedications().join(', ') || null,
      dosage: null,
      physicianName: health.getEmergencyContactName(),
      physicianPhone: health.getEmergencyContactNumber(),
      notes: health.getSpecialNeeds() ?? health.getVaccinationStatus(),
    }
  }
}
