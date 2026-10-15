import type { IStaffRepository } from '../domain/IStaffRepository';
import type { HireStaffCommand, HireStaffResponse } from './HireStaff';
import type { IClock } from '@/src/application/ports/input/IClock';
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher';
import type { ILogger } from '@/src/application/ports/input/ILogger';
import type { ISequenceGenerator } from '@/src/shared/domain/shared-kernel';
import { ValidationError } from '@/src/application/exceptions';
import { Staff } from '../domain/StaffEntity';
import { EmployeeCode } from '../domain/StaffValueObjects';
import { InvalidDepartmentError, DuplicateEmployeeCodeError } from '../domain/StaffErrors';
import { EmploymentType, StaffGender } from '../domain/StaffEnums';
import { Email } from '@/src/domain/value-objects/Email';
import { PhoneNumber } from '@/src/domain/value-objects/PhoneNumber';

export interface DepartmentChecker {
  belongsToSchool(departmentId: string, schoolId: string): Promise<boolean>;
}

export function afghanYear(now: Date): number {
  const gYear = now.getFullYear();
  const march21 = new Date(gYear, 2, 21);
  return (now < march21 ? gYear - 1 : gYear) - 621;
}

export class HireStaffHandler {
  constructor(
    private readonly staffRepository: IStaffRepository,
    private readonly sequences: ISequenceGenerator,
    private readonly departments: DepartmentChecker,
    private readonly clock: IClock,
    private readonly eventPublisher: IEventPublisher,
    private readonly logger: ILogger,
  ) {}

  public async execute(command: HireStaffCommand): Promise<HireStaffResponse> {
    this.logger.info('Hiring staff', { schoolId: command.schoolId });
    this.validate(command);

    if (command.departmentId) {
      const ok = await this.departments.belongsToSchool(command.departmentId, command.schoolId);
      if (!ok) throw new InvalidDepartmentError(command.departmentId);
    }

    const seq = await this.sequences.next(`employee-${afghanYear(this.clock.now())}`, command.schoolId);
    const employeeCode = EmployeeCode.create(`EBPS-${afghanYear(this.clock.now())}-${String(seq).padStart(4, '0')}`);
    if (await this.staffRepository.existsByEmployeeCode(command.schoolId, employeeCode)) {
      throw new DuplicateEmployeeCodeError(employeeCode.getValue());
    }

    const staff = Staff.hire({
      schoolId: command.schoolId,
      employeeCode,
      firstName: command.firstName.trim(),
      fatherName: command.fatherName.trim(),
      grandfatherName: command.grandfatherName?.trim() || undefined,
      familyName: command.familyName.trim(),
      dateOfBirth: command.dateOfBirth ? new Date(command.dateOfBirth) : undefined,
      gender: command.gender as StaffGender,
      bloodGroup: command.bloodGroup,
      nationality: command.nationality || 'Afghan',
      nationalId: command.nationalId,
      photoUrl: command.photoUrl,
      phone: command.phone ? PhoneNumber.create(command.phone) : undefined,
      email: command.email ? Email.create(command.email) : undefined,
      address: command.address,
      city: command.city,
      province: command.province,
      departmentId: command.departmentId,
      designation: command.designation,
      employmentType: command.employmentType as EmploymentType,
      joinDate: new Date(command.joinDate),
      endDate: command.endDate ? new Date(command.endDate) : undefined,
    });

    await this.staffRepository.save(staff);
    await this.eventPublisher.publishAll(staff.pullDomainEvents());
    this.logger.info('Staff hired', { staffId: staff.getId().getValue() });

    return {
      staffId: staff.getId().getValue(),
      employeeCode: employeeCode.getValue(),
      fullName: staff.getFullName(),
      status: staff.getStatus(),
      joinDate: staff.getJoinDate(),
    };
  }

  private validate(c: HireStaffCommand): void {
    const errors: Record<string, string> = {};
    if (!c.schoolId) errors.schoolId = 'School is required';
    for (const f of ['firstName', 'fatherName', 'familyName'] as const) {
      if (!c[f]?.trim()) errors[f] = `${f} is required`;
    }
    if (!['male', 'female', 'other'].includes(c.gender)) errors.gender = 'gender must be male, female, or other';
    if (!['full_time', 'part_time', 'contract', 'temporary'].includes(c.employmentType))
      errors.employmentType = 'Invalid employmentType';
    if (!c.joinDate || Number.isNaN(new Date(c.joinDate).getTime())) errors.joinDate = 'joinDate must be a valid date';
    if (Object.keys(errors).length > 0) throw new ValidationError('Validation failed', errors);
  }
}
