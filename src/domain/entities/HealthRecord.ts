import { DomainError } from '../errors/DomainError'

export interface HealthRecordProps {
  chronicIllness?: string
  allergies?: string[]
  medications?: string[]
  vaccinationStatus: string
  specialNeeds?: string
  emergencyContactName: string
  emergencyContactNumber: string
  lastUpdated: Date
}

export class HealthRecord {
  private readonly props: HealthRecordProps

  private constructor(props: HealthRecordProps) {
    this.props = props
  }

  public static create(params: {
    chronicIllness?: string
    allergies?: string[]
    medications?: string[]
    vaccinationStatus: string
    specialNeeds?: string
    emergencyContactName: string
    emergencyContactNumber: string
  }): HealthRecord {
    if (!params.emergencyContactName || params.emergencyContactName.trim().length < 2) {
      throw new DomainError('Emergency contact name is required')
    }
    if (!params.emergencyContactNumber || params.emergencyContactNumber.trim().length < 5) {
      throw new DomainError('Emergency contact number is required')
    }
    if (!params.vaccinationStatus || params.vaccinationStatus.trim().length < 2) {
      throw new DomainError('Vaccination status is required')
    }
    return new HealthRecord({
      chronicIllness: params.chronicIllness?.trim(),
      allergies: params.allergies || [],
      medications: params.medications || [],
      vaccinationStatus: params.vaccinationStatus.trim(),
      specialNeeds: params.specialNeeds?.trim(),
      emergencyContactName: params.emergencyContactName.trim(),
      emergencyContactNumber: params.emergencyContactNumber.trim(),
      lastUpdated: new Date(),
    })
  }

  public static reconstitute(props: HealthRecordProps): HealthRecord {
    return new HealthRecord(props)
  }

  public getChronicIllness(): string | undefined {
    return this.props.chronicIllness
  }

  public getAllergies(): string[] {
    return [...(this.props.allergies || [])]
  }

  public getMedications(): string[] {
    return [...(this.props.medications || [])]
  }

  public getVaccinationStatus(): string {
    return this.props.vaccinationStatus
  }

  public getSpecialNeeds(): string | undefined {
    return this.props.specialNeeds
  }

  public getEmergencyContactName(): string {
    return this.props.emergencyContactName
  }

  public getEmergencyContactNumber(): string {
    return this.props.emergencyContactNumber
  }

  public getLastUpdated(): Date {
    return this.props.lastUpdated
  }

  public toProps(): HealthRecordProps {
    return {
      ...this.props,
      allergies: [...(this.props.allergies || [])],
      medications: [...(this.props.medications || [])],
    }
  }

  public update(params: Partial<Omit<HealthRecordProps, 'lastUpdated'>>): void {
    if (params.chronicIllness !== undefined) this.props.chronicIllness = params.chronicIllness
    if (params.allergies !== undefined) this.props.allergies = params.allergies
    if (params.medications !== undefined) this.props.medications = params.medications
    if (params.vaccinationStatus !== undefined) this.props.vaccinationStatus = params.vaccinationStatus
    if (params.specialNeeds !== undefined) this.props.specialNeeds = params.specialNeeds
    if (params.emergencyContactName !== undefined) this.props.emergencyContactName = params.emergencyContactName
    if (params.emergencyContactNumber !== undefined) this.props.emergencyContactNumber = params.emergencyContactNumber
    this.props.lastUpdated = new Date()
  }
}
