import type { IQuery } from '@/src/shared/application/base-handlers';
import type { StaffStatus, EmploymentType } from '../domain/StaffEnums';

export interface ListStaffQuery extends IQuery {
  schoolId: string;
  query?: string;
  departmentId?: string;
  designation?: string;
  status?: StaffStatus;
  employmentType?: EmploymentType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StaffListItem {
  id: string;
  employeeCode: string;
  fullName: string;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  employmentType: string;
  status: string;
  joinDate: string;
  phone?: string;
  email?: string;
}

export interface ListStaffResponse {
  data: StaffListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
