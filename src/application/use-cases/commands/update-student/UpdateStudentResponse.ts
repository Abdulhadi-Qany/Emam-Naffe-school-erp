import type { StudentStatus } from '@/src/domain/enums'

export interface UpdateStudentResponse {
  studentId: string
  admissionNumber: string
  fullNameEnglish: string
  status: StudentStatus
  /** Field names that were actually changed. */
  updatedFields: string[]
}
