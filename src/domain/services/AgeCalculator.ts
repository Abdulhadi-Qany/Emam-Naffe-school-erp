import { DateOfBirth } from '../value-objects/DateOfBirth'

export class AgeCalculator {
  public static ageOn(dateOfBirth: DateOfBirth, reference: Date = new Date()): number {
    return dateOfBirth.getAgeInYears(reference)
  }

  public static isSchoolAge(dateOfBirth: DateOfBirth, min = 4, max = 18): boolean {
    return dateOfBirth.isSchoolAge(min, max)
  }
}
