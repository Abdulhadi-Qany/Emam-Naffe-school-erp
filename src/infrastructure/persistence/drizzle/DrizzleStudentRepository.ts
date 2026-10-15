import { db } from '@/lib/db'
import {
  students,
  studentGuardians,
  studentDocuments,
  studentSpecialCategories,
  studentHealthRecords,
  grades,
  sections,
} from '@/lib/db/schema'
import { eq, and, or, like, desc, asc, sql, count, inArray } from 'drizzle-orm'
import type {
  IStudentRepository,
  StudentSearchFilters,
  PaginationOptions,
  PaginatedResult,
} from '@/src/domain/repositories'
import type { Student } from '@/src/domain/entities'
import {
  StudentId,
  AdmissionNumber,
  TazkiraNumber,
  GradeLevel,
  StudentStatus,
  SpecialCategory,
  PhoneNumber,
} from '@/src/domain'
import { StudentPersistenceMapper, type StudentRow } from '../mappers/StudentPersistenceMapper'

/** Drizzle transaction handle type. */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Drizzle/Postgres implementation of the IStudentRepository port.
 * This is the ONLY class that knows how students are persisted.
 */
export class DrizzleStudentRepository implements IStudentRepository {
  // ---------- Commands ----------

  public async save(student: Student): Promise<void> {
    const id = student.getId().getValue()
    await db.transaction(async (tx) => {
      const values = await this.withAcademicRefs(tx, student)
      await tx.insert(students).values(values as never)

      const guardian = student.getGuardian()
      if (guardian) {
        await tx.insert(studentGuardians).values(StudentPersistenceMapper.toGuardianRow(id, guardian) as never)
      }

      for (const doc of student.getDocuments()) {
        await tx.insert(studentDocuments).values(StudentPersistenceMapper.toDocumentRow(id, doc) as never)
      }

      for (const cat of student.getSpecialCategories()) {
        await tx.insert(studentSpecialCategories).values(StudentPersistenceMapper.toSpecialCategoryRow(id, cat) as never)
      }

      const health = student.getHealthRecord()
      if (health) {
        await tx.insert(studentHealthRecords).values(StudentPersistenceMapper.toHealthRow(id, health) as never)
      }
    })
  }

  public async update(student: Student): Promise<void> {
    const id = student.getId().getValue()
    await db.transaction(async (tx) => {
      const values = await this.withAcademicRefs(tx, student)
      await tx
        .update(students)
        .set({ ...values, updatedAt: new Date() } as never)
        .where(eq(students.id, id))

      // Upsert dependent rows so guardian/health changes survive a reload.
      await tx.delete(studentGuardians).where(eq(studentGuardians.studentId, id))
      const guardian = student.getGuardian()
      if (guardian) {
        await tx.insert(studentGuardians).values(StudentPersistenceMapper.toGuardianRow(id, guardian) as never)
      }

      await tx.delete(studentHealthRecords).where(eq(studentHealthRecords.studentId, id))
      const health = student.getHealthRecord()
      if (health) {
        await tx.insert(studentHealthRecords).values(StudentPersistenceMapper.toHealthRow(id, health) as never)
      }
    })
  }

  public async delete(id: StudentId): Promise<void> {
    await db.delete(students).where(eq(students.id, id.getValue()))
  }

  // ---------- Queries ----------

  public async findById(id: StudentId): Promise<Student | null> {
    const row = await this.load(eq(students.id, id.getValue()))
    return row ? StudentPersistenceMapper.toDomain(row) : null
  }

  public async findByAdmissionNumber(admissionNumber: AdmissionNumber): Promise<Student | null> {
    const row = await this.load(eq(students.admissionNumber, admissionNumber.getValue()))
    return row ? StudentPersistenceMapper.toDomain(row) : null
  }

  public async findByTazkiraNumber(tazkiraNumber: TazkiraNumber): Promise<Student | null> {
    const row = await this.load(eq(students.nationalId, tazkiraNumber.getValue()))
    return row ? StudentPersistenceMapper.toDomain(row) : null
  }

  public async findByFatherPhone(phone: string): Promise<Student[]> {
    let normalized = phone
    try {
      normalized = PhoneNumber.create(phone).getValue()
    } catch {
      // keep the raw input when it is already in international format
    }
    const guardianRows = await db
      .select({ studentId: studentGuardians.studentId })
      .from(studentGuardians)
      .where(eq(studentGuardians.mobile, normalized))
    const studentRows = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.fatherMobile, normalized))
    const ids = new Set<string>([
      ...guardianRows.map((g) => g.studentId),
      ...studentRows.map((s) => s.id),
    ])
    const out: Student[] = []
    for (const sid of ids) {
      const full = await this.findById(StudentId.fromString(sid))
      if (full) out.push(full)
    }
    return out
  }
  public async findAll(
    filters?: StudentSearchFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Student>> {
    const page = pagination?.page ?? 1
    const limit = pagination?.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = this.buildConditions(filters)

    let countQuery = db.select({ count: count() }).from(students)
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as typeof countQuery
    }
    const [totalRow] = await countQuery
    const total = Number(totalRow?.count ?? 0)

    const sortColumn = pagination?.sortBy === 'admissionNumber' ? students.admissionNumber : students.createdAt
    const orderFn = pagination?.sortOrder === 'asc' ? asc : desc

    let query = db.select().from(students).orderBy(orderFn(sortColumn)).limit(limit).offset(offset)
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }
    const rows = await query

    const data: Student[] = []
    for (const s of rows) {
      const full = await this.load(eq(students.id, s.id))
      if (full) data.push(StudentPersistenceMapper.toDomain(full))
    }

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  public async findByGrade(gradeLevel: GradeLevel, section?: string): Promise<Student[]> {
    const result = await this.findAll({ gradeLevel }, { page: 1, limit: 1000 })
    void section
    return result.data
  }

  public async findByStatus(status: StudentStatus): Promise<Student[]> {
    const rows = await db.select().from(students).where(eq(students.status, status as never))
    const out: Student[] = []
    for (const s of rows) {
      const full = await this.load(eq(students.id, s.id))
      if (full) out.push(StudentPersistenceMapper.toDomain(full))
    }
    return out
  }

  public async findBySpecialCategory(category: SpecialCategory): Promise<Student[]> {
    const catRows = await db
      .select({ studentId: studentSpecialCategories.studentId })
      .from(studentSpecialCategories)
      .where(eq(studentSpecialCategories.category, category))
    const out: Student[] = []
    for (const c of catRows) {
      const full = await this.findById(StudentId.fromString(c.studentId))
      if (full) out.push(full)
    }
    return out
  }

  public async countByGrade(gradeLevel: GradeLevel): Promise<number> {
    // gradeLevel is stored as a grade id reference in the schema; count by admission-number prefix
    const code = gradeLevel.getCode()
    const [row] = await db
      .select({ count: count() })
      .from(students)
      .where(like(students.admissionNumber, `%-${code}-%`))
    return Number(row?.count ?? 0)
  }

  public async getNextSequenceForGrade(year: number, grade: string): Promise<number> {
    const code = grade.toUpperCase()
    const pattern = `EBPS-${year}-${code}-%`
    const rows = await db
      .select({ admissionNumber: students.admissionNumber })
      .from(students)
      .where(like(students.admissionNumber, pattern))
    let max = 0
    for (const r of rows) {
      const parts = r.admissionNumber.split('-')
      const seq = parseInt(parts[parts.length - 1], 10)
      if (!Number.isNaN(seq) && seq > max) max = seq
    }
    return max + 1
  }

  public async existsByAdmissionNumber(admissionNumber: AdmissionNumber): Promise<boolean> {
    const [row] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.admissionNumber, admissionNumber.getValue()))
    return Number(row?.count ?? 0) > 0
  }

  public async existsByTazkiraNumber(tazkiraNumber: TazkiraNumber): Promise<boolean> {
    const [row] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.nationalId, tazkiraNumber.getValue()))
    return Number(row?.count ?? 0) > 0
  }
  // ---------- Private helpers ----------

  private buildConditions(filters?: StudentSearchFilters) {
    if (!filters) return []
    const conditions = []
    if (filters.schoolId) conditions.push(eq(students.schoolId, filters.schoolId))
    if (filters.status) conditions.push(eq(students.status, filters.status as never))
    if (filters.gender) conditions.push(eq(students.gender, filters.gender as never))
    if (filters.province) conditions.push(eq(students.province, filters.province))
    if (filters.admissionNumber) conditions.push(eq(students.admissionNumber, filters.admissionNumber))
    if (filters.tazkiraNumber) conditions.push(eq(students.nationalId, filters.tazkiraNumber))
    if (filters.name) {
      const q = `%${filters.name}%`
      conditions.push(
        or(
          like(students.firstName, q),
          like(students.familyName, q),
          like(students.fullName, q)
        )
      )
    }
    if (filters.fatherName) conditions.push(like(students.fatherName, `%${filters.fatherName}%`))
    if (filters.district) conditions.push(eq(students.city, filters.district))
    if (filters.gradeLevel) {
      conditions.push(
        inArray(
          students.currentGradeId,
          db.select({ id: grades.id }).from(grades).where(eq(grades.level, filters.gradeLevel.getGrade()))
        )
      )
    }
    if (filters.section) {
      conditions.push(
        inArray(
          students.currentSectionId,
          db.select({ id: sections.id }).from(sections).where(eq(sections.name, filters.section))
        )
      )
    }
    if (filters.specialCategory) {
      conditions.push(
        inArray(
          students.id,
          db
            .select({ studentId: studentSpecialCategories.studentId })
            .from(studentSpecialCategories)
            .where(eq(studentSpecialCategories.category, filters.specialCategory))
        )
      )
    }
    if (typeof filters.enrollmentYear === 'number') {
      conditions.push(like(students.admissionNumber, `EBPS-${filters.enrollmentYear}-%`))
    }
    return conditions.filter(Boolean)
  }

  /** Loads a student row plus its related guardian, documents, categories, health. */
  private async load(where: ReturnType<typeof eq>): Promise<StudentRow | null> {
    const [student] = await db.select().from(students).where(where)
    if (!student) return null

    const [guardian] = await db.select().from(studentGuardians).where(eq(studentGuardians.studentId, student.id))
    const documents = await db.select().from(studentDocuments).where(eq(studentDocuments.studentId, student.id))
    const categoryRows = await db
      .select({ category: studentSpecialCategories.category })
      .from(studentSpecialCategories)
      .where(eq(studentSpecialCategories.studentId, student.id))
    const [health] = await db.select().from(studentHealthRecords).where(eq(studentHealthRecords.studentId, student.id))

    let gradeLevel: number | undefined
    if (student.currentGradeId) {
      const [gradeRow] = await db
        .select({ level: grades.level })
        .from(grades)
        .where(eq(grades.id, student.currentGradeId))
      gradeLevel = gradeRow?.level
    }
    let sectionName: string | undefined
    if (student.currentSectionId) {
      const [sectionRow] = await db
        .select({ name: sections.name })
        .from(sections)
        .where(eq(sections.id, student.currentSectionId))
      sectionName = sectionRow?.name
    }

    return {
      student,
      guardian: guardian ?? null,
      documents,
      specialCategories: categoryRows.map((c) => c.category),
      health: health ?? null,
      gradeLevel,
      sectionName,
    }
  }

  /** Resolves (find-or-creates) the `grades`/`sections` rows and merges their ids into the student values. */
  private async withAcademicRefs(tx: Tx, student: Student): Promise<Record<string, unknown>> {
    const level = student.getGradeLevel().getGrade()
    const letter = student.getSection().getValue()
    const gradeId = await this.ensureGrade(tx, student.getSchoolId(), level)
    const sectionId = await this.ensureSection(tx, student.getSchoolId(), gradeId, letter)
    return { ...StudentPersistenceMapper.toStudentRow(student), currentGradeId: gradeId, currentSectionId: sectionId }
  }

  private async ensureGrade(tx: Tx, schoolId: string, level: number): Promise<string> {
    const [existing] = await tx
      .select({ id: grades.id })
      .from(grades)
      .where(and(eq(grades.schoolId, schoolId), eq(grades.level, level)))
      .limit(1)
    if (existing) return existing.id
    const id = `${schoolId}:g${level}`
    await tx
      .insert(grades)
      .values({ id, schoolId, name: level === 0 ? 'Kindergarten' : `Grade ${level}`, level })
      .onConflictDoNothing()
    return id
  }

  private async ensureSection(tx: Tx, schoolId: string, gradeId: string, letter: string): Promise<string> {
    const [existing] = await tx
      .select({ id: sections.id })
      .from(sections)
      .where(and(eq(sections.schoolId, schoolId), eq(sections.gradeId, gradeId), eq(sections.name, letter)))
      .limit(1)
    if (existing) return existing.id
    const id = `${gradeId}:s${letter}`
    await tx.insert(sections).values({ id, schoolId, gradeId, name: letter }).onConflictDoNothing()
    return id
  }
}
