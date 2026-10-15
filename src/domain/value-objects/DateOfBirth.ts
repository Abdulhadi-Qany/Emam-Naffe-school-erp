import { DomainError } from '../errors/DomainError'
import {
  gregorianToSolarHijri,
  solarHijriToDate,
  type SolarHijriDate,
} from '@/lib/utils/afghanistan'

export interface SolarHijri {
  year: number
  month: number
  day: number
}

/**
 * Dual-calendar date of birth. Stores the Gregorian instant plus its Solar
 * Hijri representation. Uses the project's jalaali-based converter.
 */
export class DateOfBirth {
  private readonly gregorianDate: Date
  private readonly solarHijri: SolarHijri

  private constructor(gregorianDate: Date, solarHijri: SolarHijri) {
    this.gregorianDate = gregorianDate
    this.solarHijri = solarHijri
  }

  public static fromGregorian(date: Date): DateOfBirth {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new DomainError('Date of birth must be a valid date')
    }
    if (date.getTime() > Date.now()) {
      throw new DomainError('Date of birth cannot be in the future')
    }
    const sh: SolarHijriDate = gregorianToSolarHijri(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    )
    return new DateOfBirth(new Date(date.getTime()), {
      year: sh.year,
      month: sh.month,
      day: sh.day,
    })
  }

  public static fromSolarHijri(year: number, month: number, day: number): DateOfBirth {
    if (month < 1 || month > 12) {
      throw new DomainError('Month must be between 1 and 12')
    }
    if (day < 1 || day > 31) {
      throw new DomainError('Day must be between 1 and 31')
    }
    const date = solarHijriToDate({ year, month, day, weekday: 0 })
    return DateOfBirth.fromGregorian(date)
  }

  public getGregorian(): Date {
    return new Date(this.gregorianDate.getTime())
  }

  public getSolarHijri(): SolarHijri {
    return { ...this.solarHijri }
  }

  public getAgeInYears(reference: Date = new Date()): number {
    let age = reference.getFullYear() - this.gregorianDate.getFullYear()
    const monthDiff = reference.getMonth() - this.gregorianDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < this.gregorianDate.getDate())) {
      age--
    }
    return age
  }

  public isSchoolAge(min = 4, max = 18): boolean {
    const age = this.getAgeInYears()
    return age >= min && age <= max
  }

  public toString(): string {
    return `${this.solarHijri.year}/${this.solarHijri.month}/${this.solarHijri.day}`
  }
}
