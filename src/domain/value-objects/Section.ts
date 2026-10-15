import { DomainError } from '../errors/DomainError'

const PATTERN = /^[A-Z]$/

export class Section {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  public static create(value: string): Section {
    const normalized = value.trim().toUpperCase()
    if (!PATTERN.test(normalized)) {
      throw new DomainError(`Invalid section: ${value} (expected a single letter A-Z)`)
    }
    return new Section(normalized)
  }

  public getValue(): string {
    return this.value
  }

  public equals(other: Section): boolean {
    return this.value === other.value
  }

  public toString(): string {
    return this.value
  }
}
