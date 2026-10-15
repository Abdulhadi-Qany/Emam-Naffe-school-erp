import { Student } from '../entities/Student'
import { StudentId } from '../value-objects/StudentId'
import { AdmissionNumber } from '../value-objects/AdmissionNumber'
import { TazkiraNumber } from '../value-objects/TazkiraNumber'
import { GradeLevel } from '../value-objects/GradeLevel'
import { StudentStatus } from '../enums/StudentStatus'
import { SpecialCategory } from '../enums/SpecialCategory'

export interface StudentSearchFilters {
  schoolId?: string
  name?: string
  admissionNumber?: string
  tazkiraNumber?: string
  fatherName?: string
  gradeLevel?: GradeLevel
  section?: string
  gender?: string
  status?: StudentStatus
  specialCategory?: SpecialCategory
  province?: string
  district?: string
  enrollmentYear?: number
  ageMin?: number
  ageMax?: number
}

export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Port (interface) implemented by the infrastructure layer.
 * The domain depends on this abstraction, never on Drizzle/Postgres.
 */
export interface IStudentRepository {
  // Commands
  save(student: Student): Promise<void>
  update(student: Student): Promise<void>
  delete(id: StudentId): Promise<void>

  // Queries
  findById(id: StudentId): Promise<Student | null>
  findByAdmissionNumber(admissionNumber: AdmissionNumber): Promise<Student | null>
  findByTazkiraNumber(tazkiraNumber: TazkiraNumber): Promise<Student | null>
  findByFatherPhone(phone: string): Promise<Student[]>
  findAll(filters?: StudentSearchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Student>>
  findByGrade(gradeLevel: GradeLevel, section?: string): Promise<Student[]>
  findByStatus(status: StudentStatus): Promise<Student[]>
  findBySpecialCategory(category: SpecialCategory): Promise<Student[]>
  countByGrade(gradeLevel: GradeLevel): Promise<number>
  getNextSequenceForGrade(year: number, grade: string): Promise<number>
  existsByAdmissionNumber(admissionNumber: AdmissionNumber): Promise<boolean>
  existsByTazkiraNumber(tazkiraNumber: TazkiraNumber): Promise<boolean>
}
