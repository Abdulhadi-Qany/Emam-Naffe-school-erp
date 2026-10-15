import { BaseDomainEvent } from './DomainEvent'
import { StudentId } from '../value-objects/StudentId'

export class StudentTransferredEvent extends BaseDomainEvent {
  constructor(
    public readonly studentId: StudentId,
    public readonly reason: string
  ) {
    super('StudentTransferred', studentId.getValue())
  }
}
