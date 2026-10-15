import { StudentId } from '../value-objects/StudentId'
import { AdmissionNumber } from '../value-objects/AdmissionNumber'
import { TazkiraNumber } from '../value-objects/TazkiraNumber'
import { PhoneNumber } from '../value-objects/PhoneNumber'
import { Email } from '../value-objects/Email'
import { DateOfBirth } from '../value-objects/DateOfBirth'
import { GradeLevel } from '../value-objects/GradeLevel'
import { Section } from '../value-objects/Section'
import { Money } from '../value-objects/Money'
import { Address } from './Address'
import { Guardian } from './Guardian'
import { HealthRecord } from './HealthRecord'
import { StudentStatus } from '../enums/StudentStatus'
import { Gender } from '../enums/Gender'
import { BloodGroup } from '../enums/BloodGroup'
import { SpecialCategory } from '../enums/SpecialCategory'
import { DomainError } from '../errors/DomainError'
import { StudentEnrolledEvent } from '../events/StudentEnrolledEvent'
import { StudentPromotedEvent } from '../events/StudentPromotedEvent'
import { StudentTransferredEvent } from '../events/StudentTransferredEvent'
import { StudentDroppedOutEvent } from '../events/StudentDroppedOutEvent'
import { DomainEvent } from '../events/DomainEvent'

export interface StudentDocumentProps {
  id: string
  type: string
  fileName: string
  fileUrl: string
  uploadedAt: Date
  verified?: boolean
}

export class StudentDocument {
  private constructor(private readonly props: StudentDocumentProps) {}

  public static create(props: StudentDocumentProps): StudentDocument {
    return new StudentDocument({ ...props, verified: props.verified ?? false })
  }

  public getId(): string { return this.props.id }
  public getType(): string { return this.props.type }
  public getFileName(): string { return this.props.fileName }
  public getFileUrl(): string { return this.props.fileUrl }
  public getUploadedAt(): Date { return this.props.uploadedAt }
  public isVerified(): boolean { return this.props.verified ?? false }

  public verify(): void {
    ;(this.props as { verified?: boolean }).verified = true
  }

  public toProps(): StudentDocumentProps {
    return { ...this.props }
  }
}

export interface StudentProps {
  id: StudentId
  schoolId: string
  admissionNumber: AdmissionNumber
  firstNameDari: string
  lastNameDari: string
  firstNamePashto: string
  lastNamePashto: string
  firstNameEnglish: string
  lastNameEnglish: string
  fatherName: string
  grandfatherName: string
  motherName: string
  dateOfBirth: DateOfBirth
  gender: Gender
  tazkiraNumber?: TazkiraNumber
  bloodGroup: BloodGroup
  nationality: string
  motherTongue: string
  sect: string
  email?: Email
  currentAddress: Address
  permanentAddress: Address
  phoneNumber?: PhoneNumber
  fatherPhone: PhoneNumber
  motherPhone?: PhoneNumber
  guardian?: Guardian
  gradeLevel: GradeLevel
  section: Section
  rollNumber?: number
  admissionDate: Date
  enrollmentDate: Date
  status: StudentStatus
  healthRecord?: HealthRecord
  specialCategories: SpecialCategory[]
  disabilityType?: string
  previousSchool?: string
  previousGrade?: string
  photoUrl?: string
  documents: StudentDocument[]
  feeWaiverPercentage: number
  scholarshipId?: string
  createdAt: Date
  updatedAt: Date
}

export class Student {
  private readonly props: StudentProps
  private domainEvents: DomainEvent[] = []

  private constructor(props: StudentProps) {
    this.props = props
  }

  public static enroll(params: {
    id: StudentId
    schoolId: string
    admissionNumber: AdmissionNumber
    firstNameDari: string
    lastNameDari: string
    firstNamePashto: string
    lastNamePashto: string
    firstNameEnglish: string
    lastNameEnglish: string
    fatherName: string
    grandfatherName: string
    motherName: string
    dateOfBirth: DateOfBirth
    gender: Gender
    tazkiraNumber?: TazkiraNumber
    bloodGroup: BloodGroup
    nationality: string
    motherTongue: string
    sect: string
    email?: Email
    currentAddress: Address
    permanentAddress: Address
    fatherPhone: PhoneNumber
    motherPhone?: PhoneNumber
    phoneNumber?: PhoneNumber
    guardian?: Guardian
    gradeLevel: GradeLevel
    section: Section
    admissionDate: Date
    enrollmentDate?: Date
    photoUrl?: string
    healthRecord?: HealthRecord
    specialCategories?: SpecialCategory[]
    disabilityType?: string
    previousSchool?: string
    previousGrade?: string
    allowOutOfSchoolAge?: boolean
  }): Student {
    Student.validateName(params.firstNameDari, 'First name (Dari)')
    Student.validateName(params.lastNameDari, 'Last name (Dari)')
    Student.validateName(params.firstNamePashto, 'First name (Pashto)')
    Student.validateName(params.lastNamePashto, 'Last name (Pashto)')
    Student.validateName(params.firstNameEnglish, 'First name (English)')
    Student.validateName(params.lastNameEnglish, 'Last name (English)')

    if (!params.allowOutOfSchoolAge && !params.dateOfBirth.isSchoolAge()) {
      throw new DomainError(
        `Student age (${params.dateOfBirth.getAgeInYears()}) is not within school age range (4-18)`
      )
    }

    const now = new Date()
    const student = new Student({
      id: params.id,
      schoolId: params.schoolId,
      admissionNumber: params.admissionNumber,
      firstNameDari: params.firstNameDari.trim(),
      lastNameDari: params.lastNameDari.trim(),
      firstNamePashto: params.firstNamePashto.trim(),
      lastNamePashto: params.lastNamePashto.trim(),
      firstNameEnglish: params.firstNameEnglish.trim(),
      lastNameEnglish: params.lastNameEnglish.trim(),
      fatherName: params.fatherName.trim(),
      grandfatherName: params.grandfatherName.trim(),
      motherName: params.motherName.trim(),
      dateOfBirth: params.dateOfBirth,
      gender: params.gender,
      tazkiraNumber: params.tazkiraNumber,
      bloodGroup: params.bloodGroup,
      nationality: params.nationality,
      motherTongue: params.motherTongue,
      sect: params.sect,
      email: params.email,
      currentAddress: params.currentAddress,
      permanentAddress: params.permanentAddress,
      fatherPhone: params.fatherPhone,
      motherPhone: params.motherPhone,
      phoneNumber: params.phoneNumber,
      guardian: params.guardian,
      gradeLevel: params.gradeLevel,
      section: params.section,
      admissionDate: params.admissionDate,
      enrollmentDate: params.enrollmentDate ?? params.admissionDate,
      status: StudentStatus.ACTIVE,
      healthRecord: params.healthRecord,
      specialCategories: params.specialCategories || [],
      disabilityType: params.disabilityType,
      previousSchool: params.previousSchool,
      previousGrade: params.previousGrade,
      photoUrl: params.photoUrl,
      documents: [],
      feeWaiverPercentage: 0,
      createdAt: now,
      updatedAt: now,
    })

    student.addDomainEvent(
      new StudentEnrolledEvent(student.props.id, student.props.admissionNumber)
    )
    return student
  }

  public static reconstitute(props: StudentProps): Student {
    return new Student(props)
  }

  private static validateName(name: string, field: string): void {
    if (!name || name.trim().length < 2) {
      throw new DomainError(`${field} must be at least 2 characters`)
    }
  }

  private touch(): void {
    ;(this.props as { updatedAt: Date }).updatedAt = new Date()
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event)
  }
  // ============ BUSINESS METHODS ============

  public promoteTo(newGrade: GradeLevel, newSection: Section): void {
    if (this.props.status !== StudentStatus.ACTIVE) {
      throw new DomainError('Only active students can be promoted')
    }
    if (newGrade.getGrade() !== this.props.gradeLevel.getGrade() + 1) {
      throw new DomainError(
        `Cannot promote from Grade ${this.props.gradeLevel.getGrade()} to Grade ${newGrade.getGrade()}. Must promote to the next grade.`
      )
    }
    const oldGrade = this.props.gradeLevel
    this.props.gradeLevel = newGrade
    this.props.section = newSection
    this.touch()
    this.addDomainEvent(new StudentPromotedEvent(this.props.id, oldGrade, newGrade))
  }

  public transferOut(reason: string): void {
    if (this.props.status !== StudentStatus.ACTIVE) {
      throw new DomainError('Only active students can be transferred')
    }
    if (!reason || reason.trim().length < 5) {
      throw new DomainError('Transfer reason must be at least 5 characters')
    }
    this.props.status = StudentStatus.TRANSFERRED
    this.touch()
    this.addDomainEvent(new StudentTransferredEvent(this.props.id, reason.trim()))
  }

  public markAsDroppedOut(reason: string): void {
    if (this.props.status !== StudentStatus.ACTIVE) {
      throw new DomainError('Only active students can be marked as dropped out')
    }
    if (!reason || reason.trim().length < 5) {
      throw new DomainError('Dropout reason must be at least 5 characters')
    }
    this.props.status = StudentStatus.DROPPED_OUT
    this.touch()
    this.addDomainEvent(new StudentDroppedOutEvent(this.props.id, reason.trim()))
  }

  public graduate(): void {
    if (this.props.gradeLevel.getGrade() !== 12) {
      throw new DomainError('Only Grade 12 students can graduate')
    }
    if (this.props.status !== StudentStatus.ACTIVE) {
      throw new DomainError('Only active students can graduate')
    }
    this.props.status = StudentStatus.GRADUATED
    this.touch()
  }

  public updateContactInfo(params: {
    phoneNumber?: PhoneNumber
    fatherPhone?: PhoneNumber
    motherPhone?: PhoneNumber
    email?: Email
    currentAddress?: Address
    permanentAddress?: Address
  }): void {
    if (params.phoneNumber) this.props.phoneNumber = params.phoneNumber
    if (params.fatherPhone) this.props.fatherPhone = params.fatherPhone
    if (params.motherPhone) this.props.motherPhone = params.motherPhone
    if (params.email) this.props.email = params.email
    if (params.currentAddress) this.props.currentAddress = params.currentAddress
    if (params.permanentAddress) this.props.permanentAddress = params.permanentAddress
    this.touch()
  }

  public updateHealthRecord(healthRecord: HealthRecord): void {
    this.props.healthRecord = healthRecord
    this.touch()
  }

  public addSpecialCategory(category: SpecialCategory): void {
    if (!this.props.specialCategories.includes(category)) {
      this.props.specialCategories.push(category)
      this.touch()
    }
  }

  public removeSpecialCategory(category: SpecialCategory): void {
    this.props.specialCategories = this.props.specialCategories.filter((c) => c !== category)
    this.touch()
  }

  public applyFeeWaiver(percentage: number, reason: string): void {
    if (percentage < 0 || percentage > 100) {
      throw new DomainError('Fee waiver percentage must be between 0 and 100')
    }
    if (percentage > 0 && (!reason || reason.trim().length < 5)) {
      throw new DomainError('Fee waiver reason is required')
    }
    this.props.feeWaiverPercentage = percentage
    this.touch()
  }

  public addDocument(document: StudentDocument): void {
    const existing = this.props.documents.find(
      (d) => d.getType() === document.getType() && d.getFileName() === document.getFileName()
    )
    if (existing) {
      throw new DomainError(`Document of type ${document.getType()} already exists`)
    }
    this.props.documents.push(document)
    this.touch()
  }

  public verifyDocument(documentId: string): void {
    const doc = this.props.documents.find((d) => d.getId() === documentId)
    if (!doc) {
      throw new DomainError(`Document with ID ${documentId} not found`)
    }
    doc.verify()
    this.touch()
  }

  public updatePhoto(photoUrl: string): void {
    this.props.photoUrl = photoUrl
    this.touch()
  }

  public assignRollNumber(rollNumber: number): void {
    if (rollNumber < 1) {
      throw new DomainError('Roll number must be positive')
    }
    this.props.rollNumber = rollNumber
    this.touch()
  }

  public isEligibleForPromotion(minAttendancePercentage: number, attendancePercentage: number): boolean {
    if (this.props.status !== StudentStatus.ACTIVE) return false
    return attendancePercentage >= minAttendancePercentage
  }

  public hasSpecialCategory(category: SpecialCategory): boolean {
    return this.props.specialCategories.includes(category)
  }

  public hasFeeWaiver(): boolean {
    return this.props.feeWaiverPercentage > 0
  }

  public calculateFeeAfterWaiver(baseFee: Money): Money {
    if (this.props.feeWaiverPercentage === 0) return baseFee
    return baseFee.subtract(baseFee.percentage(this.props.feeWaiverPercentage))
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents]
    this.domainEvents = []
    return events
  }
  // ============ GETTERS ============

  public getId(): StudentId { return this.props.id }
  public getSchoolId(): string { return this.props.schoolId }
  public getAdmissionNumber(): AdmissionNumber { return this.props.admissionNumber }
  public getFirstNameDari(): string { return this.props.firstNameDari }
  public getLastNameDari(): string { return this.props.lastNameDari }
  public getFullNameDari(): string { return `${this.props.firstNameDari} ${this.props.lastNameDari}` }
  public getFirstNamePashto(): string { return this.props.firstNamePashto }
  public getLastNamePashto(): string { return this.props.lastNamePashto }
  public getFullNamePashto(): string { return `${this.props.firstNamePashto} ${this.props.lastNamePashto}` }
  public getFirstNameEnglish(): string { return this.props.firstNameEnglish }
  public getLastNameEnglish(): string { return this.props.lastNameEnglish }
  public getFullNameEnglish(): string { return `${this.props.firstNameEnglish} ${this.props.lastNameEnglish}` }
  public getFatherName(): string { return this.props.fatherName }
  public getGrandfatherName(): string { return this.props.grandfatherName }
  public getMotherName(): string { return this.props.motherName }
  public getDateOfBirth(): DateOfBirth { return this.props.dateOfBirth }
  public getGender(): Gender { return this.props.gender }
  public getTazkiraNumber(): TazkiraNumber | undefined { return this.props.tazkiraNumber }
  public getBloodGroup(): BloodGroup { return this.props.bloodGroup }
  public getNationality(): string { return this.props.nationality }
  public getMotherTongue(): string { return this.props.motherTongue }
  public getSect(): string { return this.props.sect }
  public getEmail(): Email | undefined { return this.props.email }
  public getCurrentAddress(): Address { return this.props.currentAddress }
  public getPermanentAddress(): Address { return this.props.permanentAddress }
  public getPhoneNumber(): PhoneNumber | undefined { return this.props.phoneNumber }
  public getFatherPhone(): PhoneNumber { return this.props.fatherPhone }
  public getMotherPhone(): PhoneNumber | undefined { return this.props.motherPhone }
  public getGuardian(): Guardian | undefined { return this.props.guardian }
  public getGradeLevel(): GradeLevel { return this.props.gradeLevel }
  public getSection(): Section { return this.props.section }
  public getRollNumber(): number | undefined { return this.props.rollNumber }
  public getAdmissionDate(): Date { return this.props.admissionDate }
  public getEnrollmentDate(): Date { return this.props.enrollmentDate }
  public getStatus(): StudentStatus { return this.props.status }
  public getHealthRecord(): HealthRecord | undefined { return this.props.healthRecord }
  public getSpecialCategories(): SpecialCategory[] { return [...this.props.specialCategories] }
  public getDisabilityType(): string | undefined { return this.props.disabilityType }
  public getPreviousSchool(): string | undefined { return this.props.previousSchool }
  public getPreviousGrade(): string | undefined { return this.props.previousGrade }
  public getPhotoUrl(): string | undefined { return this.props.photoUrl }
  public getDocuments(): StudentDocument[] { return [...this.props.documents] }
  public getFeeWaiverPercentage(): number { return this.props.feeWaiverPercentage }
  public getScholarshipId(): string | undefined { return this.props.scholarshipId }
  public getCreatedAt(): Date { return this.props.createdAt }
  public getUpdatedAt(): Date { return this.props.updatedAt }

  public toProps(): StudentProps {
    return {
      ...this.props,
      specialCategories: [...this.props.specialCategories],
      documents: [...this.props.documents],
    }
  }
}
