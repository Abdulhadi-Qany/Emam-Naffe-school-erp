import { db } from '@/lib/db';
import { staff, departments } from '@/lib/db/schema';
import { eq, and, or, ilike, count, sql } from 'drizzle-orm';
import type { IStaffRepository, StaffSearchFilters } from '../domain/IStaffRepository';
import type { PaginationOptions, PaginatedResult } from '@/src/shared/domain/shared-kernel';
import { normalizePagination } from '@/src/shared/domain/shared-kernel';
import { Staff } from '../domain/StaffEntity';
import { StaffId, EmployeeCode } from '../domain/StaffValueObjects';
import { StaffPersistenceMapper } from './StaffPersistenceMapper';

/**
 * Drizzle/Postgres implementation of IStaffRepository.
 * ONLY class that knows how staff rows are stored.
 */
export class DrizzleStaffRepository implements IStaffRepository {
  public async save(staffEntity: Staff): Promise<void> {
    await db.insert(staff).values(StaffPersistenceMapper.toRow(staffEntity) as never);
  }

  public async update(staffEntity: Staff): Promise<void> {
    const row = StaffPersistenceMapper.toRow(staffEntity);
    await db
      .update(staff)
      .set({ ...row, updatedAt: new Date() } as never)
      .where(eq(staff.id, staffEntity.getId().getValue()));
  }

  public async delete(id: StaffId): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id.getValue()));
  }

  public async findById(id: StaffId): Promise<Staff | null> {
    const [row] = await db.select().from(staff).where(eq(staff.id, id.getValue())).limit(1);
    return row ? StaffPersistenceMapper.toDomain(row as Record<string, unknown>) : null;
  }

  public async findByEmployeeCode(schoolId: string, code: EmployeeCode): Promise<Staff | null> {
    const [row] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.schoolId, schoolId), eq(staff.employeeCode, code.getValue())))
      .limit(1);
    return row ? StaffPersistenceMapper.toDomain(row as Record<string, unknown>) : null;
  }

  public async existsByEmployeeCode(schoolId: string, code: EmployeeCode): Promise<boolean> {
    return (await this.findByEmployeeCode(schoolId, code)) !== null;
  }

  public async findAll(filters?: StaffSearchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Staff>> {
    const p = normalizePagination(pagination);
    const conditions = this.buildConditions(filters);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db.select({ count: count() }).from(staff).where(where as never);
    const total = totalRow?.count ?? 0;

    const rows = await db
      .select()
      .from(staff)
      .where(where as never)
      .orderBy(sql`${staff.createdAt} desc`)
      .limit(p.limit)
      .offset((p.page - 1) * p.limit);

    return {
      data: rows.map((r) => StaffPersistenceMapper.toDomain(r as Record<string, unknown>)),
      total,
      page: p.page,
      limit: p.limit,
      totalPages: Math.max(1, Math.ceil(total / p.limit)),
    };
  }

  private buildConditions(filters?: StaffSearchFilters) {
    const conditions = [];
    if (filters?.schoolId) conditions.push(eq(staff.schoolId, filters.schoolId));
    if (filters?.departmentId) conditions.push(eq(staff.departmentId, filters.departmentId));
    if (filters?.designation) conditions.push(eq(staff.designation, filters.designation));
    if (filters?.status) conditions.push(eq(staff.status, filters.status as never));
    if (filters?.employmentType) conditions.push(eq(staff.employmentType, filters.employmentType as never));
    if (filters?.query) {
      const q = `%${filters.query}%`;
      conditions.push(
        or(
          ilike(staff.firstName, q),
          ilike(staff.fatherName, q),
          ilike(staff.familyName, q),
          ilike(staff.fullName, q),
          ilike(staff.employeeCode, q),
          ilike(staff.email, q),
          ilike(staff.phone, q),
        )!,
      );
    }
    return conditions;
  }

  /** Department join for list enrichment (kept in repository, not controller). */
  public async departmentName(departmentId: string | undefined): Promise<string | undefined> {
    if (!departmentId) return undefined;
    const [row] = await db.select({ name: departments.name }).from(departments).where(eq(departments.id, departmentId)).limit(1);
    return row?.name ?? undefined;
  }
}
