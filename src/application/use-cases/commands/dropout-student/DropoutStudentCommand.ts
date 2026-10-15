export interface DropoutStudentCommand {
  studentId: string
  reason: string
  dropoutDate?: Date
  updatedBy: string
}
