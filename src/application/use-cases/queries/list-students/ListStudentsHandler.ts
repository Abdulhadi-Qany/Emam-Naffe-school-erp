import type { ListStudentsQuery } from './ListStudentsQuery'
import type { ListStudentsResponse, StudentListItem } from './ListStudentsResponse'
import type { IStudentRepository } from '@/src/domain/repositories'
import type { Student } from '@/src/domain/entities'

export class ListStudentsHandler {
  constructor(private readonly studentRepository: IStudentRepository) {}

  public async execute(query: ListStudentsQuery): Promise<ListStudentsResponse> {
    const pagination = {
      page: query.pagination?.page ?? 1,
      limit: query.pagination?.limit ?? 20,
      sortBy: query.pagination?.sortBy ?? 'createdAt',
      sortOrder: query.pagination?.sortOrder ?? 'desc',
    }

    const result = await this.studentRepository.findAll(query.filters, pagination)

    return {
      ...result,
      data: result.data.map((s: Student) => this.toListItem(s)),
    }
  }

  private toListItem(s: Student): StudentListItem {
    return {
      id: s.getId().getValue(),
      admissionNumber: s.getAdmissionNumber().getValue(),
      fullNameDari: s.getFullNameDari(),
      fullNameEnglish: s.getFullNameEnglish(),
      fatherName: s.getFatherName(),
      gradeLevel: s.getGradeLevel().getGrade(),
      gradeCode: s.getGradeLevel().getCode(),
      section: s.getSection().getValue(),
      gender: s.getGender(),
      status: s.getStatus(),
      province: s.getCurrentAddress().getProvince(),
      admissionDate: s.getAdmissionDate().toISOString(),
    }
  }
}
