import { BaseDomainEvent } from './DomainEvent'
import { StudentId } from '../value-objects/StudentId'

export class StudentDroppedOutEvent extends BaseDomainEvent {
  constructor(
    public readonly studentId: StudentId,
    public readonly reason: string
  ) {
    super('StudentDroppedOut', studentId.getValue())
  }
}
