import { DomainError } from '@/src/domain/errors/DomainError';

/** StaffId — UUID identity of the Staff aggregate. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class StaffId {
  private readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }
  public static generate(): StaffId {
    return new StaffId(crypto.randomUUID());
  }
  public static fromString(value: string): StaffId {
    if (!value || value.trim().length === 0) throw new DomainError('StaffId cannot be empty');
    if (!UUID_PATTERN.test(value)) throw new DomainError(`Invalid StaffId format: ${value}`);
    return new StaffId(value);
  }
  public getValue(): string {
    return this.value;
  }
  public equals(other: StaffId): boolean {
    return this.value === other.value;
  }
  public toString(): string {
    return this.value;
  }
}

/** EmployeeCode — EBPS-1403-0001 style, unique per school. */
const CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

export class EmployeeCode {
  private readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }
  public static create(value: string): EmployeeCode {
    const cleaned = value.trim().toUpperCase();
    if (cleaned.length < 4) throw new DomainError(`Invalid employee code: ${value}`);
    if (!CODE_PATTERN.test(cleaned)) throw new DomainError(`Invalid employee code: ${value}`);
    return new EmployeeCode(cleaned);
  }
  public getValue(): string {
    return this.value;
  }
  public equals(other: EmployeeCode): boolean {
    return this.value === other.value;
  }
  public toString(): string {
    return this.value;
  }
}
