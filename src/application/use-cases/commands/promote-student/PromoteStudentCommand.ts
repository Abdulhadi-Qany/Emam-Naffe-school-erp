export interface PromoteStudentCommand {
  studentId: string
  /** Section to place the student in for the new grade (defaults to current section). */
  newSection?: string
  reason?: string
  updatedBy: string
}
