import type { TransferStudentCommand } from './TransferStudentCommand'
import type { TransferStudentResponse } from './TransferStudentResponse'
import type { IStudentRepository } from '@/src/domain/repositories'
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher'
import type { ILogger } from '@/src/application/ports/input/ILogger'
import { NotFoundError, ValidationError } from '@/src/application/exceptions'
import { StudentId } from '@/src/domain'

export class TransferStudentHandler {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly logger: ILogger
  ) {}

  public async execute(command: TransferStudentCommand): Promise<TransferStudentResponse> {
    this.logger.info('Transferring student out', { studentId: command.studentId, updatedBy: command.updatedBy })

    if (!command.reason || command.reason.trim().length < 5) {
      throw new ValidationError('Validation failed', {
        reason: 'Transfer reason must be at least 5 characters',
      })
    }

    const student = await this.studentRepository.findById(StudentId.fromString(command.studentId))
    if (!student) throw new NotFoundError('Student', command.studentId)

    student.transferOut(command.reason)
    await this.studentRepository.update(student)

    const events = student.pullDomainEvents()
    if (events.length > 0) await this.eventPublisher.publishAll(events)

    this.logger.info('Student transferred', { studentId: command.studentId })

    return {
      studentId: student.getId().getValue(),
      admissionNumber: student.getAdmissionNumber().getValue(),
      fullNameEnglish: student.getFullNameEnglish(),
      status: student.getStatus(),
      reason: command.reason.trim(),
    }
  }
}
