import type { IStudentRepository } from '@/src/domain/repositories'
import type { IAdmissionNumberGenerator } from '@/src/domain/services'
import { AdmissionNumber } from '@/src/domain'

/**
 * Generates unique admission numbers using the repository's sequence lookup.
 * Format: EBPS-[year]-[GRADE]-[sequence], e.g. EBPS-1403-G1-0045.
 */
export class DrizzleAdmissionNumberGenerator implements IAdmissionNumberGenerator {
  constructor(private readonly studentRepository: IStudentRepository) {}

  public async generate(schoolId: string, solarHijriYear: number, gradeCode: string): Promise<AdmissionNumber> {
    // sequence is independent of school in this simple scheme; retry on collision
    let lastError: unknown
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const next = await this.studentRepository.getNextSequenceForGrade(solarHijriYear, gradeCode)
      const candidate = AdmissionNumber.create(solarHijriYear, gradeCode, next)
      const exists = await this.studentRepository.existsByAdmissionNumber(candidate)
      if (!exists) return candidate
      lastError = new Error('Collision on sequence ' + next)
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to generate a unique admission number')
  }
}
