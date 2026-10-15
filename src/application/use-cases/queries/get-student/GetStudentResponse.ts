export interface GetStudentResponse {
  id: string
  admissionNumber: string
  personalInfo: {
    firstNameDari: string
    lastNameDari: string
    fullNameDari: string
    firstNamePashto: string
    lastNamePashto: string
    fullNamePashto: string
    firstNameEnglish: string
    lastNameEnglish: string
    fullNameEnglish: string
    fatherName: string
    grandfatherName: string
    motherName: string
    dateOfBirth: {
      solarHijri: { year: number; month: number; day: number }
      gregorian: string
      age: number
    }
    gender: string
    tazkiraNumber?: string
    bloodGroup: string
    nationality: string
    motherTongue: string
    sect: string
  }
  contactInfo: {
    studentMobile?: string
    fatherMobile: string
    motherMobile?: string
    email?: string
    currentAddress: {
      province: string
      district: string
      village: string
      houseNumber?: string
      landmark?: string
      fullAddress: string
    }
    permanentAddress: {
      province: string
      district: string
      village: string
      houseNumber?: string
      landmark?: string
      fullAddress: string
    }
  }
  guardian?: {
    name: string
    relation: string
    occupation: string
    tazkiraNumber?: string
    mobile: string
  }
  academicInfo: {
    gradeLevel: number
    gradeDisplayName: string
    section: string
    rollNumber?: number
    admissionDate: string
    status: string
    previousSchool?: string
    previousGrade?: string
  }
  healthRecord?: {
    chronicIllness?: string
    allergies: string[]
    medications: string[]
    vaccinationStatus: string
    specialNeeds?: string
    emergencyContactName: string
    emergencyContactNumber: string
  }
  specialCategories: string[]
  disabilityType?: string
  feeWaiverPercentage: number
  photoUrl?: string
  documents?: Array<{
    id: string
    type: string
    fileName: string
    fileUrl: string
    verified: boolean
  }>
  createdAt: string
  updatedAt: string
}
