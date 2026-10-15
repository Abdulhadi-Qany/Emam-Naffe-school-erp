import { DomainError } from '../errors/DomainError'

/**
 * Format: EBPS-[YEAR]-[GRADE]-[SEQUENCE]
 * Example: EBPS-1403-G1-0045  or  EBPS-1403-KG-0045
 */
export class AdmissionNumber {
  private readonly value: string
  private static readonly PATTERN = /^EBPS-(\d{4})-(KG|G(?:[1-9]|1[0-2]))-(\d{4})$/

  private constructor(value: string) {
    this.value = value
  }

  public static create(solarHijriYear: number, grade: string, sequence: number): AdmissionNumber {
    if (solarHijriYear < 1300 || solarHijriYear > 1500) {
      throw new DomainError('Invalid Solar Hijri year')
    }
    if (sequence < 1 || sequence > 9999) {
      throw new DomainError('Sequence must be between 1 and 9999')
    }
    const gradeCode = AdmissionNumber.normalizeGrade(grade)
    const sequencePadded = sequence.toString().padStart(4, '0')
    return new AdmissionNumber(`EBPS-${solarHijriYear}-${gradeCode}-${sequencePadded}`)
  }

  public static fromString(value: string): AdmissionNumber {
    if (!AdmissionNumber.PATTERN.test(value)) {
      throw new DomainError(`Invalid admission number format: ${value}`)
    }
    return new AdmissionNumber(value)
  }

  private static normalizeGrade(grade: string): string {
    const g = grade.toUpperCase().trim()
    if (g === 'KG' || g === 'K' || g === '0') return 'KG'
    const n = parseInt(g.replace(/^G/, ''), 10)
    if (Number.isNaN(n) || n < 1 || n > 12) {
      throw new DomainError(`Invalid grade for admission number: ${grade}`)
    }
    return `G${n}`
  }

  private match(): RegExpMatchArray {
    const m = this.value.match(AdmissionNumber.PATTERN)
    if (!m) throw new DomainError(`Corrupt admission number: ${this.value}`)
    return m
  }

  public getYear(): number {
    return parseInt(this.match()[1], 10)
  }

  public getGrade(): string {
    return this.match()[2]
  }

  public getSequence(): number {
    return parseInt(this.match()[3], 10)
  }

  public getValue(): string {
    return this.value
  }

  public equals(other: AdmissionNumber): boolean {
    return this.value === other.value
  }

  public toString(): string {
    return this.value
  }
}
