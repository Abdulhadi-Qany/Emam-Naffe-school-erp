import type { StudentStatus } from '@/src/domain/enums'

export interface DropoutStudentResponse {
  studentId: string
  admissionNumber: string
  fullNameEnglish: string
  status: StudentStatus
  reason: string
}
