import type { PromoteStudentCommand } from './PromoteStudentCommand'
import type { PromoteStudentResponse } from './PromoteStudentResponse'
import type { IStudentRepository } from '@/src/domain/repositories'
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher'
import type { ILogger } from '@/src/application/ports/input/ILogger'
import { NotFoundError } from '@/src/application/exceptions'
import { StudentId, GradeLevel, Section } from '@/src/domain'

export class PromoteStudentHandler {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly logger: ILogger
  ) {}

  public async execute(command: PromoteStudentCommand): Promise<PromoteStudentResponse> {
    this.logger.info('Promoting student', { studentId: command.studentId, updatedBy: command.updatedBy })

    const student = await this.studentRepository.findById(StudentId.fromString(command.studentId))
    if (!student) throw new NotFoundError('Student', command.studentId)

    const previousGrade = student.getGradeLevel().getGrade()
    const newGrade = GradeLevel.create(previousGrade + 1)
    const newSection = command.newSection
      ? Section.create(command.newSection)
      : student.getSection()

    student.promoteTo(newGrade, newSection)
    await this.studentRepository.update(student)

    const events = student.pullDomainEvents()
    if (events.length > 0) await this.eventPublisher.publishAll(events)

    this.logger.info('Student promoted', {
      studentId: command.studentId,
      fromGrade: previousGrade,
      toGrade: newGrade.getGrade(),
    })

    return {
      studentId: student.getId().getValue(),
      admissionNumber: student.getAdmissionNumber().getValue(),
      fullNameEnglish: student.getFullNameEnglish(),
      previousGrade,
      newGrade: newGrade.getGrade(),
      newSection: newSection.getValue(),
      status: student.getStatus(),
    }
  }
}
