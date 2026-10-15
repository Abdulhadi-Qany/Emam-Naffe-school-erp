export interface TransferStudentCommand {
  studentId: string
  reason: string
  receivingSchool?: string
  transferCertificateUrl?: string
  updatedBy: string
}
