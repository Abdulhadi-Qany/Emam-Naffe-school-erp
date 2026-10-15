import { BaseDomainEvent } from './DomainEvent'
import { StudentId } from '../value-objects/StudentId'
import { GradeLevel } from '../value-objects/GradeLevel'

export class StudentPromotedEvent extends BaseDomainEvent {
  constructor(
    public readonly studentId: StudentId,
    public readonly oldGrade: GradeLevel,
    public readonly newGrade: GradeLevel
  ) {
    super('StudentPromoted', studentId.getValue())
  }
}
