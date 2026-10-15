export interface AdmitStudentCommand {
  // School / class
  schoolId: string
  applyingForGrade: number
  section?: string

  // Personal (tri-language)
  firstNameDari: string
  lastNameDari: string
  firstNamePashto: string
  lastNamePashto: string
  firstNameEnglish: string
  lastNameEnglish: string
  fatherName: string
  grandfatherName: string
  motherName: string
  dateOfBirthSolarHijri: { year: number; month: number; day: number }
  dateOfBirthGregorian?: string
  gender: 'male' | 'female' | 'other'
  tazkiraNumber?: string
  bloodGroup: string
  nationality: string
  motherTongue: string
  sect: string
  email?: string

  // Address — current
  currentProvince: string
  currentDistrict: string
  currentVillage: string
  currentHouseNumber?: string
  currentLandmark?: string

  // Address — permanent
  permanentProvince: string
  permanentDistrict: string
  permanentVillage: string
  permanentHouseNumber?: string
  permanentLandmark?: string

  // Contact
  studentMobile?: string
  fatherMobile: string
  motherMobile?: string

  // Guardian
  guardianName?: string
  guardianRelation?: string
  guardianOccupation?: string
  guardianTazkiraNumber?: string
  guardianMobile?: string

  // Previous education
  previousSchool?: string
  previousGrade?: string
  transferCertificateUrl?: string

  // Health
  chronicIllness?: string
  allergies?: string[]
  medications?: string[]
  vaccinationStatus?: string
  specialNeeds?: string
  emergencyContactName: string
  emergencyContactNumber: string

  // Special categories
  specialCategories?: string[]
  disabilityType?: string

  // Documents
  documents?: Array<{ type: string; fileName: string; fileUrl: string }>

  // Meta
  admissionDate?: Date
  createdBy: string
  allowOutOfSchoolAge?: boolean
}
