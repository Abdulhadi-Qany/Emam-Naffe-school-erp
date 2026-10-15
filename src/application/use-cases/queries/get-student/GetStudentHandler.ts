import type { GetStudentQuery } from './GetStudentQuery'
import type { GetStudentResponse } from './GetStudentResponse'
import type { IStudentRepository } from '@/src/domain/repositories'
import { StudentNotFoundError } from '@/src/domain/errors'
import { NotFoundError } from '@/src/application/exceptions'
import { StudentId } from '@/src/domain'
import { StudentMapper } from '@/src/application/mappers'

export class GetStudentHandler {
  constructor(private readonly studentRepository: IStudentRepository) {}

  public async execute(query: GetStudentQuery): Promise<GetStudentResponse> {
    let studentId: StudentId
    try {
      studentId = StudentId.fromString(query.studentId)
    } catch {
      throw new NotFoundError('Student', query.studentId)
    }

    const student = await this.studentRepository.findById(studentId)
    if (!student) {
      throw new StudentNotFoundError(query.studentId)
    }

    return StudentMapper.toGetStudentResponse(student)
  }
}
