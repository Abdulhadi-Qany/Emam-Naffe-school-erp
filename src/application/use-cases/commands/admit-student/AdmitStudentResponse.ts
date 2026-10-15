import type { StudentStatus } from '@/src/domain/enums'

export interface AdmitStudentResponse {
  studentId: string
  admissionNumber: string
  fullNameDari: string
  fullNameEnglish: string
  gradeLevel: number
  section: string
  status: StudentStatus
  admissionDate: Date
}
