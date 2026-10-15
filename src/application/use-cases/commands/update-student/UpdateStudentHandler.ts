import type { UpdateStudentCommand } from './UpdateStudentCommand'
import type { UpdateStudentResponse } from './UpdateStudentResponse'
import type { IStudentRepository } from '@/src/domain/repositories'
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher'
import type { ILogger } from '@/src/application/ports/input/ILogger'
import { NotFoundError } from '@/src/application/exceptions'
import { StudentId, PhoneNumber, Email, Address, HealthRecord } from '@/src/domain'

/**
 * Partial update — only fields present on the command are changed.
 * Domain invariants (phone formats, email, address rules) are enforced
 * by the value objects inside the Student aggregate.
 */
export class UpdateStudentHandler {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly logger: ILogger
  ) {}

  public async execute(command: UpdateStudentCommand): Promise<UpdateStudentResponse> {
    this.logger.info('Updating student', { studentId: command.studentId, updatedBy: command.updatedBy })

    const student = await this.studentRepository.findById(StudentId.fromString(command.studentId))
    if (!student) throw new NotFoundError('Student', command.studentId)

    const updatedFields: string[] = []

    const contact: {
      phoneNumber?: PhoneNumber
      fatherPhone?: PhoneNumber
      motherPhone?: PhoneNumber
      email?: Email
      currentAddress?: Address
      permanentAddress?: Address
    } = {}

    if (command.studentMobile) {
      contact.phoneNumber = PhoneNumber.create(command.studentMobile)
      updatedFields.push('studentMobile')
    }
    if (command.fatherMobile) {
      contact.fatherPhone = PhoneNumber.create(command.fatherMobile)
      updatedFields.push('fatherMobile')
    }
    if (command.motherMobile) {
      contact.motherPhone = PhoneNumber.create(command.motherMobile)
      updatedFields.push('motherMobile')
    }
    if (command.email) {
      contact.email = Email.create(command.email)
      updatedFields.push('email')
    }
    if (command.currentAddress) {
      contact.currentAddress = Address.create(command.currentAddress)
      updatedFields.push('currentAddress')
    }
    if (command.permanentAddress) {
      contact.permanentAddress = Address.create(command.permanentAddress)
      updatedFields.push('permanentAddress')
    }
    if (Object.keys(contact).length > 0) {
      student.updateContactInfo(contact)
    }

    const hasHealthChanges =
      command.chronicIllness !== undefined ||
      command.allergies !== undefined ||
      command.medications !== undefined ||
      command.specialNeeds !== undefined
    if (hasHealthChanges) {
      let health = student.getHealthRecord()
      if (!health) {
        health = HealthRecord.create({
          vaccinationStatus: 'unknown',
          emergencyContactName: student.getFatherName(),
          emergencyContactNumber: student.getFatherPhone().getValue(),
        })
      }
      health.update({
        chronicIllness: command.chronicIllness,
        allergies: command.allergies,
        medications: command.medications,
        specialNeeds: command.specialNeeds,
      })
      student.updateHealthRecord(health)
      if (command.chronicIllness !== undefined) updatedFields.push('chronicIllness')
      if (command.allergies !== undefined) updatedFields.push('allergies')
      if (command.medications !== undefined) updatedFields.push('medications')
      if (command.specialNeeds !== undefined) updatedFields.push('specialNeeds')
    }

    const guardian = student.getGuardian()
    if (guardian && (command.guardianName || command.guardianMobile)) {
      if (command.guardianName) {
        guardian.updateName(command.guardianName)
        updatedFields.push('guardianName')
      }
      if (command.guardianMobile) {
        guardian.updatePhoneNumber(PhoneNumber.create(command.guardianMobile))
        updatedFields.push('guardianMobile')
      }
      student.updateContactInfo({}) // touch aggregate for updated_at
    }

    await this.studentRepository.update(student)

    const events = student.pullDomainEvents()
    if (events.length > 0) await this.eventPublisher.publishAll(events)

    this.logger.info('Student updated', {
      studentId: command.studentId,
      updatedFields: updatedFields.join(','),
    })

    return {
      studentId: student.getId().getValue(),
      admissionNumber: student.getAdmissionNumber().getValue(),
      fullNameEnglish: student.getFullNameEnglish(),
      status: student.getStatus(),
      updatedFields,
    }
  }
}
