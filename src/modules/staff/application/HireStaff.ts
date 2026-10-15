import type { ICommand } from '@/src/shared/application/base-handlers';

export interface HireStaffCommand extends ICommand {
  schoolId: string;
  firstName: string;
  fatherName: string;
  grandfatherName?: string;
  familyName: string;
  dateOfBirth?: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  nationality?: string;
  nationalId?: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  departmentId?: string;
  designation?: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary';
  joinDate: string;
  endDate?: string;
  createdBy: string;
}

export interface HireStaffResponse {
  staffId: string;
  employeeCode: string;
  fullName: string;
  status: string;
  joinDate: Date;
}
