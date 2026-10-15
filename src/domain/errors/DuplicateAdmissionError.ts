import { DomainError } from './DomainError'

export class DuplicateAdmissionError extends DomainError {
  constructor(admissionNumber: string) {
    super(
      `Student with admission number ${admissionNumber} already exists`,
      'DUPLICATE_ADMISSION',
      { admissionNumber }
    )
    this.name = 'DuplicateAdmissionError'
  }
}
