import type { StudentStatus } from '@/src/domain/enums'

export interface TransferStudentResponse {
  studentId: string
  admissionNumber: string
  fullNameEnglish: string
  status: StudentStatus
  reason: string
}
