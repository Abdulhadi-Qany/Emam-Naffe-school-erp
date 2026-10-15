export enum AdmissionStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  TEST_SCHEDULED = 'test_scheduled',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FEE_PENDING = 'fee_pending',
  ENROLLED = 'enrolled',
  ACTIVE = 'active',
}

export const ADMISSION_STATUSES: readonly string[] = Object.values(AdmissionStatus)
