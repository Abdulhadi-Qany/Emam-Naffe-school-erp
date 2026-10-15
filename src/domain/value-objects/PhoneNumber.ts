import { DomainError } from '../errors/DomainError'

/**
 * Afghan mobile numbers: +93 followed by 9 digits (operator prefix 7x).
 * Major prefixes: 70/71 Roshan, 72/73 Etisalat, 74–77 MTN, 78/79 AWCC.
 */
export class PhoneNumber {
  private readonly value: string
  private static readonly PATTERN = /^\+93[7-9]\d{8}$/

  private constructor(value: string) {
    this.value = value
  }

  public static create(value: string): PhoneNumber {
    const cleaned = value.replace(/[\s\-()]/g, '')
    let normalized = cleaned
    if (cleaned.startsWith('0')) {
      normalized = '+93' + cleaned.substring(1)
    } else if (cleaned.startsWith('93')) {
      normalized = '+' + cleaned
    } else if (!cleaned.startsWith('+93')) {
      normalized = '+93' + cleaned
    }
    if (!PhoneNumber.PATTERN.test(normalized)) {
      throw new DomainError(`Invalid Afghan phone number: ${value}`)
    }
    return new PhoneNumber(normalized)
  }

  public getValue(): string {
    return this.value
  }

  public getProvider(): string {
    const prefix = this.value.substring(3, 5)
    const providers: Record<string, string> = {
      '70': 'Roshan',
      '71': 'Roshan',
      '72': 'Etisalat',
      '73': 'Etisalat',
      '74': 'MTN',
      '75': 'MTN',
      '76': 'MTN',
      '77': 'MTN',
      '78': 'AWCC',
      '79': 'AWCC',
    }
    return providers[prefix] || 'Unknown'
  }

  public equals(other: PhoneNumber): boolean {
    return this.value === other.value
  }

  public toString(): string {
    return this.value
  }
}
