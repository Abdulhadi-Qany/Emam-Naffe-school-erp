export interface GetStudentQuery {
  studentId: string
  includeHealthRecord?: boolean
  includeDocuments?: boolean
  includeAcademicHistory?: boolean
  requestedBy: string
}
