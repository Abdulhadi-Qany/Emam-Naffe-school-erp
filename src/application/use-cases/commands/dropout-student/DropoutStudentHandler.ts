import type { DropoutStudentCommand } from './DropoutStudentCommand'
import type { DropoutStudentResponse } from './DropoutStudentResponse'
import type { IStudentRepository } from '@/src/domain/repositories'
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher'
import type { ILogger } from '@/src/application/ports/input/ILogger'
import { NotFoundError, ValidationError } from '@/src/application/exceptions'
import { StudentId } from '@/src/domain'

export class DropoutStudentHandler {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly logger: ILogger
  ) {}

  public async execute(command: DropoutStudentCommand): Promise<DropoutStudentResponse> {
    this.logger.info('Marking student as dropped out', {
      studentId: command.studentId,
      updatedBy: command.updatedBy,
    })

    if (!command.reason || command.reason.trim().length < 5) {
      throw new ValidationError('Validation failed', {
        reason: 'Dropout reason must be at least 5 characters',
      })
    }

    const student = await this.studentRepository.findById(StudentId.fromString(command.studentId))
    if (!student) throw new NotFoundError('Student', command.studentId)

    student.markAsDroppedOut(command.reason)
    await this.studentRepository.update(student)

    const events = student.pullDomainEvents()
    if (events.length > 0) await this.eventPublisher.publishAll(events)

    this.logger.info('Student marked as dropped out', { studentId: command.studentId })

    return {
      studentId: student.getId().getValue(),
      admissionNumber: student.getAdmissionNumber().getValue(),
      fullNameEnglish: student.getFullNameEnglish(),
      status: student.getStatus(),
      reason: command.reason.trim(),
    }
  }
}
