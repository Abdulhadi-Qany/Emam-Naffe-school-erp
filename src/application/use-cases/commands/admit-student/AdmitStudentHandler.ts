import type { AdmitStudentCommand } from './AdmitStudentCommand'
import type { AdmitStudentResponse } from './AdmitStudentResponse'
import type { IStudentRepository } from '@/src/domain/repositories'
import type { IAdmissionNumberGenerator } from '@/src/domain/services'
import type { IIdGenerator } from '@/src/application/ports/input/IIdGenerator'
import type { IClock } from '@/src/application/ports/input/IClock'
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher'
import type { ILogger } from '@/src/application/ports/input/ILogger'
import { ValidationError } from '@/src/application/exceptions'
import {
  Student,
  StudentDocument,
  Address,
  Guardian,
  HealthRecord,
  StudentId,
  TazkiraNumber,
  PhoneNumber,
  Email,
  DateOfBirth,
  GradeLevel,
  Section,
  Gender,
  BloodGroup,
  SpecialCategory,
  GuardianRelation,
} from '@/src/domain'

export class AdmitStudentHandler {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly admissionNumberGenerator: IAdmissionNumberGenerator,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock,
    private readonly eventPublisher: IEventPublisher,
    private readonly logger: ILogger
  ) {}

  public async execute(command: AdmitStudentCommand): Promise<AdmitStudentResponse> {
    this.logger.info('Admitting new student', {
      grade: command.applyingForGrade,
      schoolId: command.schoolId,
    })

    this.validate(command)

    const dateOfBirth = command.dateOfBirthGregorian
      ? DateOfBirth.fromGregorian(new Date(command.dateOfBirthGregorian))
      : DateOfBirth.fromSolarHijri(
          command.dateOfBirthSolarHijri.year,
          command.dateOfBirthSolarHijri.month,
          command.dateOfBirthSolarHijri.day
        )

    const tazkira = command.tazkiraNumber ? TazkiraNumber.create(command.tazkiraNumber) : undefined
    if (tazkira) {
      const exists = await this.studentRepository.existsByTazkiraNumber(tazkira)
      if (exists) {
        throw new ValidationError('A student with this Tazkira number already exists', {
          tazkiraNumber: command.tazkiraNumber!,
        })
      }
    }

    const currentAddress = Address.create({
      province: command.currentProvince,
      district: command.currentDistrict,
      village: command.currentVillage,
      houseNumber: command.currentHouseNumber,
      landmark: command.currentLandmark,
    })

    const permanentAddress = Address.create({
      province: command.permanentProvince,
      district: command.permanentDistrict,
      village: command.permanentVillage,
      houseNumber: command.permanentHouseNumber,
      landmark: command.permanentLandmark,
    })

    const fatherPhone = PhoneNumber.create(command.fatherMobile)
    const motherPhone = command.motherMobile ? PhoneNumber.create(command.motherMobile) : undefined
    const studentPhone = command.studentMobile ? PhoneNumber.create(command.studentMobile) : undefined
    const email = command.email ? Email.create(command.email) : undefined

    let guardian: Guardian | undefined
    if (command.guardianName && command.guardianMobile) {
      guardian = Guardian.create({
        name: command.guardianName,
        relation: (command.guardianRelation as GuardianRelation) || GuardianRelation.OTHER,
        occupation: command.guardianOccupation || 'Unknown',
        tazkiraNumber: command.guardianTazkiraNumber
          ? TazkiraNumber.create(command.guardianTazkiraNumber)
          : undefined,
        phoneNumber: PhoneNumber.create(command.guardianMobile),
      })
    }

    const healthRecord = HealthRecord.create({
      chronicIllness: command.chronicIllness,
      allergies: command.allergies,
      medications: command.medications,
      vaccinationStatus: command.vaccinationStatus || 'Not specified',
      specialNeeds: command.specialNeeds,
      emergencyContactName: command.emergencyContactName,
      emergencyContactNumber: command.emergencyContactNumber,
    })

    const gradeLevel = GradeLevel.create(command.applyingForGrade)
    const section = Section.create(command.section || 'A')

    const admissionNumber = await this.admissionNumberGenerator.generate(
      command.schoolId,
      dateOfBirth.getSolarHijri().year,
      gradeLevel.getCode()
    )
    const student = Student.enroll({
      id: StudentId.fromString(this.idGenerator.generate()),
      schoolId: command.schoolId,
      admissionNumber,
      firstNameDari: command.firstNameDari,
      lastNameDari: command.lastNameDari,
      firstNamePashto: command.firstNamePashto,
      lastNamePashto: command.lastNamePashto,
      firstNameEnglish: command.firstNameEnglish,
      lastNameEnglish: command.lastNameEnglish,
      fatherName: command.fatherName,
      grandfatherName: command.grandfatherName,
      motherName: command.motherName,
      dateOfBirth,
      gender: command.gender as Gender,
      tazkiraNumber: tazkira,
      bloodGroup: (command.bloodGroup as BloodGroup) || BloodGroup.UNKNOWN,
      nationality: command.nationality,
      motherTongue: command.motherTongue,
      sect: command.sect,
      email,
      currentAddress,
      permanentAddress,
      phoneNumber: studentPhone,
      fatherPhone,
      motherPhone,
      guardian,
      gradeLevel,
      section,
      admissionDate: command.admissionDate || this.clock.now(),
      healthRecord,
      specialCategories: (command.specialCategories || []) as SpecialCategory[],
      disabilityType: command.disabilityType,
      previousSchool: command.previousSchool,
      previousGrade: command.previousGrade,
      allowOutOfSchoolAge: command.allowOutOfSchoolAge,
    })

    if (command.documents && command.documents.length > 0) {
      for (const doc of command.documents) {
        student.addDocument(
          StudentDocument.create({
            id: this.idGenerator.generate(),
            type: doc.type,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            uploadedAt: this.clock.now(),
          })
        )
      }
    }

    await this.studentRepository.save(student)

    const events = student.pullDomainEvents()
    if (events.length > 0) {
      await this.eventPublisher.publishAll(events)
    }

    this.logger.info('Student admitted successfully', {
      studentId: student.getId().getValue(),
      admissionNumber: admissionNumber.getValue(),
    })

    return {
      studentId: student.getId().getValue(),
      admissionNumber: admissionNumber.getValue(),
      fullNameDari: student.getFullNameDari(),
      fullNameEnglish: student.getFullNameEnglish(),
      gradeLevel: student.getGradeLevel().getGrade(),
      section: student.getSection().getValue(),
      status: student.getStatus(),
      admissionDate: student.getAdmissionDate(),
    }
  }
  private validate(command: AdmitStudentCommand): void {
    const errors: Record<string, string> = {}

    if (!command.schoolId) errors.schoolId = 'School is required'
    if (!command.firstNameDari || command.firstNameDari.trim().length < 2) {
      errors.firstNameDari = 'First name (Dari) is required (min 2 chars)'
    }
    if (!command.lastNameDari || command.lastNameDari.trim().length < 2) {
      errors.lastNameDari = 'Last name (Dari) is required (min 2 chars)'
    }
    if (!command.firstNameEnglish || command.firstNameEnglish.trim().length < 2) {
      errors.firstNameEnglish = 'First name (English) is required (min 2 chars)'
    }
    if (!command.lastNameEnglish || command.lastNameEnglish.trim().length < 2) {
      errors.lastNameEnglish = 'Last name (English) is required (min 2 chars)'
    }
    if (!command.fatherName || command.fatherName.trim().length < 2) {
      errors.fatherName = 'Father name is required'
    }
    if (!command.fatherMobile) errors.fatherMobile = 'Father mobile is required'
    if (!command.emergencyContactName) errors.emergencyContactName = 'Emergency contact name is required'
    if (!command.emergencyContactNumber) errors.emergencyContactNumber = 'Emergency contact number is required'
    if (!command.currentProvince) errors.currentProvince = 'Current province is required'
    if (!command.permanentProvince) errors.permanentProvince = 'Permanent province is required'
    if (command.applyingForGrade < 0 || command.applyingForGrade > 12) {
      errors.applyingForGrade = 'Grade must be between 0 (KG) and 12'
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
  }
}
