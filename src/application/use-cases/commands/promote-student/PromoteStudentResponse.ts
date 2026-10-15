import type { StudentStatus } from '@/src/domain/enums'

export interface PromoteStudentResponse {
  studentId: string
  admissionNumber: string
  fullNameEnglish: string
  previousGrade: number
  newGrade: number
  newSection: string
  status: StudentStatus
}
