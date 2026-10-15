import { AggregateRoot } from '@/src/shared/domain/base';
import { DomainError } from '@/src/domain/errors/DomainError';
import { StaffId, EmployeeCode } from './StaffValueObjects';
import { StaffStatus, EmploymentType, StaffGender } from './StaffEnums';
import { Email } from '@/src/domain/value-objects/Email';
import { PhoneNumber } from '@/src/domain/value-objects/PhoneNumber';
import { StaffHiredEvent, StaffUpdatedEvent, StaffTerminatedEvent } from './StaffEvents';

export interface StaffProps {
  id: StaffId;
  schoolId: string;
  staffId: string;
  employeeCode: EmployeeCode;
  firstName: string;
  fatherName: string;
  grandfatherName?: string;
  familyName: string;
  fullName: string;
  dateOfBirth?: Date;
  gender: StaffGender;
  bloodGroup?: string;
  nationality: string;
  nationalId?: string;
  photoUrl?: string;
  phone?: PhoneNumber;
  email?: Email;
  address?: string;
  city?: string;
  province?: string;
  departmentId?: string;
  designation?: string;
  employmentType: EmploymentType;
  joinDate: Date;
  endDate?: Date;
  status: StaffStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface HireStaffProps extends Omit<StaffProps, 'id' | 'staffId' | 'fullName' | 'status' | 'createdAt' | 'updatedAt'> {
  id?: StaffId;
}

/**
 * Staff aggregate root. All hiring / update / termination invariants live here.
 */
export class Staff extends AggregateRoot<StaffProps> {
  private constructor(props: StaffProps) {
    super(props);
  }

  public static hire(props: HireStaffProps): Staff {
    if (!props.firstName?.trim()) throw new DomainError('First name is required');
    if (!props.fatherName?.trim()) throw new DomainError('Father name is required');
    if (!props.familyName?.trim()) throw new DomainError('Family name is required');
    if (!(props.joinDate instanceof Date) || Number.isNaN(props.joinDate.getTime()))
      throw new DomainError('joinDate must be a valid date');

    const id = props.id ?? StaffId.generate();
    const fullName = `${props.firstName.trim()} ${props.familyName.trim()}`;
    const now = new Date();
    const staff = new Staff({
      ...props,
      id,
      staffId: `STAFF-${now.getTime()}`,
      fullName,
      status: StaffStatus.ACTIVE,
      nationality: props.nationality || 'Afghan',
      createdAt: now,
      updatedAt: now,
    });
    staff.addEvent(new StaffHiredEvent(id.getValue(), props.schoolId, props.employeeCode.getValue()));
    return staff;
  }

  public static reconstitute(props: StaffProps): Staff {
    return new Staff(props);
  }

  public updateDetails(patch: Partial<Pick<StaffProps, 'phone' | 'email' | 'address' | 'city' | 'province' | 'photoUrl' | 'departmentId' | 'designation' | 'employmentType' | 'endDate' | 'nationalId' | 'bloodGroup'>>): void {
    Object.assign(this.props as unknown as Record<string, unknown>, { ...patch, updatedAt: new Date() });
    this.addEvent(new StaffUpdatedEvent(this.props.id.getValue(), this.props.schoolId));
  }

  public terminate(reason?: string): void {
    if (this.props.status === StaffStatus.TERMINATED) throw new DomainError('Staff is already terminated');
    (this.props as { status: StaffStatus }).status = StaffStatus.TERMINATED;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
    this.addEvent(new StaffTerminatedEvent(this.props.id.getValue(), this.props.schoolId, reason));
  }

  public suspend(): void {
    (this.props as { status: StaffStatus }).status = StaffStatus.SUSPENDED;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }

  public reactivate(): void {
    (this.props as { status: StaffStatus }).status = StaffStatus.ACTIVE;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }

  // Getters
  public getId(): StaffId { return this.props.id; }
  public getSchoolId(): string { return this.props.schoolId; }
  public getEmployeeCode(): EmployeeCode { return this.props.employeeCode; }
  public getFullName(): string { return this.props.fullName; }
  public getFirstName(): string { return this.props.firstName; }
  public getFatherName(): string { return this.props.fatherName; }
  public getFamilyName(): string { return this.props.familyName; }
  public getGender(): StaffGender { return this.props.gender; }
  public getStatus(): StaffStatus { return this.props.status; }
  public getEmploymentType(): EmploymentType { return this.props.employmentType; }
  public getJoinDate(): Date { return this.props.joinDate; }
  public getDepartmentId(): string | undefined { return this.props.departmentId; }
  public getDesignation(): string | undefined { return this.props.designation; }
  public getPhone(): PhoneNumber | undefined { return this.props.phone; }
  public getEmail(): Email | undefined { return this.props.email; }
}
