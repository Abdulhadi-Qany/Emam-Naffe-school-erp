import { Staff, type StaffProps } from '../domain/StaffEntity';
import { StaffId, EmployeeCode } from '../domain/StaffValueObjects';
import { StaffStatus, EmploymentType, StaffGender } from '../domain/StaffEnums';
import { Email } from '@/src/domain/value-objects/Email';
import { PhoneNumber } from '@/src/domain/value-objects/PhoneNumber';

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const toDate = (v: unknown): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** Maps between Staff aggregate and Drizzle `staff` rows. Lives in infrastructure only. */
export class StaffPersistenceMapper {
  public static toDomain(row: Record<string, unknown>): Staff {
    const joinDate = toDate(row.joinDate) ?? new Date();
    return Staff.reconstitute({
      id: StaffId.fromString(String(row.id)),
      schoolId: String(row.schoolId),
      staffId: String(row.staffId ?? row.id),
      employeeCode: EmployeeCode.create(String(row.employeeCode)),
      firstName: String(row.firstName ?? ''),
      fatherName: String(row.fatherName ?? ''),
      grandfatherName: str(row.grandfatherName),
      familyName: String(row.familyName ?? ''),
      fullName: String(row.fullName ?? `${row.firstName ?? ''} ${row.familyName ?? ''}`),
      dateOfBirth: toDate(row.dateOfBirth),
      gender: (str(row.gender) as StaffGender) ?? StaffGender.MALE,
      bloodGroup: str(row.bloodGroup),
      nationality: str(row.nationality) ?? 'Afghan',
      nationalId: str(row.nationalId),
      photoUrl: str(row.photo),
      phone: str(row.phone) ? safePhone(str(row.phone)!) : undefined,
      email: str(row.email) ? safeEmail(str(row.email)!) : undefined,
      address: str(row.address),
      city: str(row.city),
      province: str(row.province),
      departmentId: str(row.departmentId),
      designation: str(row.designation),
      employmentType: (str(row.employmentType) as EmploymentType) ?? EmploymentType.FULL_TIME,
      joinDate,
      endDate: toDate(row.endDate),
      status: (str(row.status) as StaffStatus) ?? StaffStatus.ACTIVE,
      createdAt: toDate(row.createdAt) ?? new Date(),
      updatedAt: toDate(row.updatedAt) ?? new Date(),
    });
  }

  public static toRow(s: Staff): Record<string, unknown> {
    const p = s.toProps();
    return {
      id: p.id.getValue(),
      schoolId: p.schoolId,
      staffId: p.staffId,
      employeeCode: p.employeeCode.getValue(),
      firstName: p.firstName,
      fatherName: p.fatherName,
      grandfatherName: p.grandfatherName ?? null,
      familyName: p.familyName,
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth ?? null,
      gender: p.gender,
      bloodGroup: p.bloodGroup ?? null,
      nationality: p.nationality,
      nationalId: p.nationalId ?? null,
      photo: p.photoUrl ?? null,
      phone: p.phone?.getValue() ?? null,
      email: p.email?.getValue() ?? null,
      address: p.address ?? null,
      city: p.city ?? null,
      province: p.province ?? null,
      departmentId: p.departmentId ?? null,
      designation: p.designation ?? null,
      employmentType: p.employmentType,
      joinDate: p.joinDate,
      endDate: p.endDate ?? null,
      status: p.status,
    };
  }
}

function safePhone(v: string): PhoneNumber | undefined {
  try {
    return PhoneNumber.create(v);
  } catch {
    return undefined;
  }
}

function safeEmail(v: string): Email | undefined {
  try {
    return Email.create(v);
  } catch {
    return undefined;
  }
}

export type { StaffProps };
