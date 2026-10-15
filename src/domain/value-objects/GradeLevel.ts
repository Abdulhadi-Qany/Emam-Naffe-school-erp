import { DomainError } from '../errors/DomainError'

export enum GradeLevelType {
  KINDERGARTEN = 'KG',
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  HIGH_SCHOOL = 'HIGH_SCHOOL',
}

/**
 * Grade 0 = Kindergarten, 1–12 = grades.
 */
export class GradeLevel {
  private readonly grade: number

  private constructor(grade: number) {
    this.grade = grade
  }

  public static create(grade: number): GradeLevel {
    if (!Number.isInteger(grade) || grade < 0 || grade > 12) {
      throw new DomainError('Grade must be an integer between 0 (KG) and 12')
    }
    return new GradeLevel(grade)
  }

  public static kindergarten(): GradeLevel {
    return new GradeLevel(0)
  }

  public getGrade(): number {
    return this.grade
  }

  public getType(): GradeLevelType {
    if (this.grade === 0) return GradeLevelType.KINDERGARTEN
    if (this.grade >= 1 && this.grade <= 6) return GradeLevelType.PRIMARY
    if (this.grade >= 7 && this.grade <= 9) return GradeLevelType.SECONDARY
    return GradeLevelType.HIGH_SCHOOL
  }

  public getCode(): string {
    return this.grade === 0 ? 'KG' : `G${this.grade}`
  }

  public getDisplayName(language: 'fa' | 'ps' | 'en'): string {
    const names = {
      fa: this.grade === 0 ? 'کودکستان' : `صنف ${this.grade}`,
      ps: this.grade === 0 ? 'کودکستان' : `${this.grade} ټولګی`,
      en: this.grade === 0 ? 'Kindergarten' : `Grade ${this.grade}`,
    }
    return names[language]
  }

  public next(): GradeLevel {
    if (this.grade >= 12) {
      throw new DomainError('Cannot promote beyond Grade 12')
    }
    return new GradeLevel(this.grade + 1)
  }

  public equals(other: GradeLevel): boolean {
    return this.grade === other.grade
  }

  public toString(): string {
    return this.getCode()
  }
}
