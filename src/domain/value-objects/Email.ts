import { DomainError } from '../errors/DomainError'

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export class Email {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  public static create(value: string): Email {
    const cleaned = value.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(cleaned)) {
      throw new DomainError(`Invalid email address: ${value}`)
    }
    return new Email(cleaned)
  }

  public getValue(): string {
    return this.value
  }

  public equals(other: Email): boolean {
    return this.value === other.value
  }

  public toString(): string {
    return this.value
  }
}
