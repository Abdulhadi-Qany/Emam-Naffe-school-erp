import { AdmissionNumber } from '../value-objects/AdmissionNumber'

/**
 * Domain service contract for generating unique admission numbers.
 * Implemented in the infrastructure layer (needs DB sequence lookup).
 */
export interface IAdmissionNumberGenerator {
  generate(schoolId: string, solarHijriYear: number, gradeCode: string): Promise<AdmissionNumber>
}
