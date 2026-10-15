import { DomainError } from '@/src/domain/errors/DomainError';

export class StaffNotFoundError extends DomainError {
  constructor(staffId: string) {
    super(`Staff member not found: ${staffId}`, 'STAFF_NOT_FOUND', { staffId });
    this.name = 'StaffNotFoundError';
  }
}

export class DuplicateEmployeeCodeError extends DomainError {
  constructor(code: string) {
    super(`Employee code already exists: ${code}`, 'DUPLICATE_EMPLOYEE_CODE', { code });
    this.name = 'DuplicateEmployeeCodeError';
  }
}

export class InvalidDepartmentError extends DomainError {
  constructor(departmentId: string) {
    super(`Department does not belong to this school: ${departmentId}`, 'INVALID_DEPARTMENT', { departmentId });
    this.name = 'InvalidDepartmentError';
  }
}
