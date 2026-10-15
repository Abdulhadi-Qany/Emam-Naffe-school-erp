import { DomainError } from '@/src/domain/errors/DomainError';

export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  ON_LEAVE = 'on_leave',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary',
}

export enum StaffGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}
