import { DomainError } from '../errors/DomainError'
import { InvalidTazkiraError } from '../errors/InvalidTazkiraError'

/**
 * Afghan national identity number.
 * Electronic Tazkira: 13 digits.
 * Paper Tazkira: alphanumeric (5–20 chars).
 */
export class TazkiraNumber {
  private readonly value: string
  private static readonly ELECTRONIC_PATTERN = /^\d{13}$/
  private static readonly PAPER_PATTERN = /^[A-Z0-9-]{5,20}$/i

  private constructor(value: string) {
    this.value = value
  }

  public static create(value: string): TazkiraNumber {
    const cleaned = value.trim().replace(/\s+/g, '')
    if (cleaned.length === 0) {
      throw new DomainError('Tazkira number cannot be empty')
    }
    if (
      !TazkiraNumber.ELECTRONIC_PATTERN.test(cleaned) &&
      !TazkiraNumber.PAPER_PATTERN.test(cleaned)
    ) {
      throw new InvalidTazkiraError(value)
    }
    return new TazkiraNumber(cleaned)
  }

  public isElectronic(): boolean {
    return TazkiraNumber.ELECTRONIC_PATTERN.test(this.value)
  }

  public getValue(): string {
    return this.value
  }

  public equals(other: TazkiraNumber): boolean {
    return this.value === other.value
  }

  public toString(): string {
    return this.value
  }
}
