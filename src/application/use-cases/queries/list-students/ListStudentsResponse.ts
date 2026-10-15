import type { PaginatedResult } from '@/src/domain/repositories'

export interface StudentListItem {
  id: string
  admissionNumber: string
  fullNameDari: string
  fullNameEnglish: string
  fatherName: string
  gradeLevel: number
  gradeCode: string
  section: string
  gender: string
  status: string
  province: string
  admissionDate: string
}

export type ListStudentsResponse = PaginatedResult<StudentListItem>
