import type { Staff } from './StaffEntity';
import type { StaffId } from './StaffValueObjects';
import type { EmployeeCode } from './StaffValueObjects';
import type { StaffStatus, EmploymentType } from './StaffEnums';
import type { PaginatedResult, PaginationOptions } from '@/src/shared/domain/shared-kernel';

export interface StaffSearchFilters {
  schoolId?: string;
  query?: string;
  departmentId?: string;
  designation?: string;
  status?: StaffStatus;
  employmentType?: EmploymentType;
}

/**
 * Port implemented by infrastructure. Domain depends on this abstraction only.
 */
export interface IStaffRepository {
  save(staff: Staff): Promise<void>;
  update(staff: Staff): Promise<void>;
  delete(id: StaffId): Promise<void>;
  findById(id: StaffId): Promise<Staff | null>;
  findByEmployeeCode(schoolId: string, code: EmployeeCode): Promise<Staff | null>;
  existsByEmployeeCode(schoolId: string, code: EmployeeCode): Promise<boolean>;
  findAll(filters?: StaffSearchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Staff>>;
}
