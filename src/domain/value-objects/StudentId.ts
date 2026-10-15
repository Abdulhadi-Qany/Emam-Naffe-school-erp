import { DomainError } from '../errors/DomainError'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class StudentId {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  public static generate(): StudentId {
    return new StudentId(crypto.randomUUID())
  }

  public static fromString(value: string): StudentId {
    if (!value || value.trim().length === 0) {
      throw new DomainError('StudentId cannot be empty')
    }
    if (!UUID_PATTERN.test(value)) {
      throw new DomainError('Invalid StudentId format')
    }
    return new StudentId(value)
  }

  public getValue(): string {
    return this.value
  }

  public equals(other: StudentId): boolean {
    return this.value === other.value
  }

  public toString(): string {
    return this.value
  }
}
