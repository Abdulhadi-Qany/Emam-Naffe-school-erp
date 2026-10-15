import { BaseDomainEvent } from './DomainEvent'
import { StudentId } from '../value-objects/StudentId'
import { AdmissionNumber } from '../value-objects/AdmissionNumber'

export class StudentEnrolledEvent extends BaseDomainEvent {
  constructor(
    public readonly studentId: StudentId,
    public readonly admissionNumber: AdmissionNumber
  ) {
    super('StudentEnrolled', studentId.getValue())
  }
}
