import { DomainError } from '../errors/DomainError'
import { formatAFN } from '@/lib/utils/afghanistan'

/**
 * Money in Afghanis (AFN). Stored to 2 decimal places, immutable.
 */
export class Money {
  private readonly amount: number
  private readonly currency: 'AFN' = 'AFN'

  private constructor(amount: number) {
    this.amount = Math.round(amount * 100) / 100
  }

  public static fromAFN(amount: number): Money {
    if (amount < 0) {
      throw new DomainError('Money amount cannot be negative')
    }
    if (!Number.isFinite(amount)) {
      throw new DomainError('Money amount must be a finite number')
    }
    return new Money(amount)
  }

  public static zero(): Money {
    return new Money(0)
  }

  public add(other: Money): Money {
    return new Money(this.amount + other.amount)
  }

  public subtract(other: Money): Money {
    const result = this.amount - other.amount
    if (result < 0) {
      throw new DomainError('Subtraction would result in negative amount')
    }
    return new Money(result)
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new DomainError('Multiplier cannot be negative')
    }
    return new Money(this.amount * factor)
  }

  public percentage(percent: number): Money {
    if (percent < 0 || percent > 100) {
      throw new DomainError('Percentage must be between 0 and 100')
    }
    return new Money((this.amount * percent) / 100)
  }

  public isGreaterThan(other: Money): boolean {
    return this.amount > other.amount
  }

  public isLessThan(other: Money): boolean {
    return this.amount < other.amount
  }

  public isZero(): boolean {
    return this.amount === 0
  }

  public getAmount(): number {
    return this.amount
  }

  public getCurrency(): string {
    return this.currency
  }

  public format(language: 'da' | 'ps' | 'en' = 'en'): string {
    return formatAFN(this.amount, language)
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency
  }

  public toString(): string {
    return `${this.amount} ${this.currency}`
  }
}
