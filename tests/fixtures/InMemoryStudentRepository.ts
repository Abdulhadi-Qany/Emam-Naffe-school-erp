import type {
  IStudentRepository,
  StudentSearchFilters,
  PaginationOptions,
  PaginatedResult,
} from '@/src/domain/repositories'
import type { Student } from '@/src/domain/entities'
import { StudentId, AdmissionNumber, TazkiraNumber, GradeLevel } from '@/src/domain'

/** In-memory fake of the student repository for tests. */
export class InMemoryStudentRepository implements IStudentRepository {
  private store = new Map<string, Student>()

  async save(student: Student): Promise<void> {
    this.store.set(student.getId().getValue(), student)
  }
  async update(student: Student): Promise<void> {
    this.store.set(student.getId().getValue(), student)
  }
  async delete(id: StudentId): Promise<void> {
    this.store.delete(id.getValue())
  }
  async findById(id: StudentId): Promise<Student | null> {
    return this.store.get(id.getValue()) ?? null
  }
  async findByAdmissionNumber(admissionNumber: AdmissionNumber): Promise<Student | null> {
    for (const s of this.store.values()) {
      if (s.getAdmissionNumber().getValue() === admissionNumber.getValue()) return s
    }
    return null
  }
  async findByTazkiraNumber(tazkiraNumber: TazkiraNumber): Promise<Student | null> {
    for (const s of this.store.values()) {
      if (s.getTazkiraNumber()?.getValue() === tazkiraNumber.getValue()) return s
    }
    return null
  }
  async findByFatherPhone(phone: string): Promise<Student[]> {
    return [...this.store.values()].filter((s) => s.getFatherPhone().getValue() === phone)
  }
  async findAll(filters?: StudentSearchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Student>> {
    let data = [...this.store.values()]
    if (filters?.schoolId) data = data.filter((s) => s.getSchoolId() === filters.schoolId)
    if (filters?.status) data = data.filter((s) => s.getStatus() === filters.status)
    if (filters?.admissionNumber) data = data.filter((s) => s.getAdmissionNumber().getValue() === filters.admissionNumber)
    if (filters?.tazkiraNumber) data = data.filter((s) => s.getTazkiraNumber()?.getValue() === filters.tazkiraNumber)
    if (filters?.name) {
      const q = filters.name.toLowerCase()
      data = data.filter(
        (s) =>
          s.getFullNameDari().toLowerCase().includes(q) ||
          s.getFullNameEnglish().toLowerCase().includes(q) ||
          s.getFullNamePashto().toLowerCase().includes(q)
      )
    }
    if (filters?.gradeLevel) data = data.filter((s) => s.getGradeLevel().getGrade() === filters.gradeLevel!.getGrade())
    if (filters?.section) data = data.filter((s) => s.getSection().getValue() === filters.section)
    if (filters?.gender) data = data.filter((s) => s.getGender() === filters.gender)
    if (filters?.province) data = data.filter((s) => s.getCurrentAddress().getProvince() === filters.province)
    const page = pagination?.page ?? 1
    const limit = pagination?.limit ?? 20
    const start = (page - 1) * limit
    return { data: data.slice(start, start + limit), total: data.length, page, limit, totalPages: Math.ceil(data.length / limit) }
  }
  async findByGrade(gradeLevel: GradeLevel, section?: string): Promise<Student[]> {
    return [...this.store.values()].filter(
      (s) => s.getGradeLevel().getGrade() === gradeLevel.getGrade() && (!section || s.getSection().getValue() === section)
    )
  }
  async findByStatus(status: any): Promise<Student[]> {
    return [...this.store.values()].filter((s) => s.getStatus() === status)
  }
  async findBySpecialCategory(category: any): Promise<Student[]> {
    return [...this.store.values()].filter((s) => s.hasSpecialCategory(category))
  }
  async countByGrade(gradeLevel: GradeLevel): Promise<number> {
    return [...this.store.values()].filter((s) => s.getGradeLevel().getGrade() === gradeLevel.getGrade()).length
  }
  async getNextSequenceForGrade(_year: number, _grade: string): Promise<number> {
    return this.store.size + 1
  }
  async existsByAdmissionNumber(admissionNumber: AdmissionNumber): Promise<boolean> {
    return (await this.findByAdmissionNumber(admissionNumber)) !== null
  }
  async existsByTazkiraNumber(tazkiraNumber: TazkiraNumber): Promise<boolean> {
    return (await this.findByTazkiraNumber(tazkiraNumber)) !== null
  }
}
