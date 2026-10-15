import type { IStaffRepository } from '../domain/IStaffRepository';
import type { ListStaffQuery, ListStaffResponse } from './ListStaff';
import { normalizePagination } from '@/src/shared/domain/shared-kernel';

export class ListStaffHandler {
  constructor(private readonly staffRepository: IStaffRepository) {}

  public async execute(query: ListStaffQuery): Promise<ListStaffResponse> {
    const pagination = normalizePagination({ page: query.page, limit: query.limit, sortBy: query.sortBy, sortOrder: query.sortOrder });
    const result = await this.staffRepository.findAll(
      {
        schoolId: query.schoolId,
        query: query.query,
        departmentId: query.departmentId,
        designation: query.designation,
        status: query.status,
        employmentType: query.employmentType,
      },
      pagination,
    );
    return {
      ...result,
      data: result.data.map((s) => ({
        id: s.getId().getValue(),
        employeeCode: s.getEmployeeCode().getValue(),
        fullName: s.getFullName(),
        designation: s.getDesignation(),
        departmentId: s.getDepartmentId(),
        employmentType: s.getEmploymentType(),
        status: s.getStatus(),
        joinDate: s.getJoinDate().toISOString(),
        phone: s.getPhone()?.getValue(),
        email: s.getEmail()?.getValue(),
      })),
    };
  }
}
