import { DomainError } from './DomainError'

export class InvalidTazkiraError extends DomainError {
  constructor(value: string) {
    super(`Invalid Tazkira number: ${value}`, 'INVALID_TAZKIRA', { value })
    this.name = 'InvalidTazkiraError'
  }
}
