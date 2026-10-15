/** Partial update — only provided fields are changed. */
export interface UpdateStudentCommand {
  studentId: string

  // Contact (optional — omitted fields stay unchanged)
  studentMobile?: string
  fatherMobile?: string
  motherMobile?: string
  email?: string

  // Address
  currentAddress?: {
    province: string
    district: string
    village: string
    houseNumber?: string
    landmark?: string
  }
  permanentAddress?: {
    province: string
    district: string
    village: string
    houseNumber?: string
    landmark?: string
  }

  // Health
  chronicIllness?: string
  allergies?: string[]
  medications?: string[]
  specialNeeds?: string

  // Guardian
  guardianName?: string
  guardianMobile?: string

  updatedBy: string
}
