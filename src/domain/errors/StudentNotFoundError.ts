import { DomainError } from './DomainError'

export class StudentNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Student not found: ${identifier}`, 'STUDENT_NOT_FOUND', { identifier })
    this.name = 'StudentNotFoundError'
  }
}
