import type { SearchStudentsQuery } from './SearchStudentsQuery'
import type { SearchStudentsResponse } from './SearchStudentsResponse'
import type { IStudentRepository, StudentSearchFilters } from '@/src/domain/repositories'
import { ListStudentsHandler } from '../list-students/ListStudentsHandler'

const ADMISSION_PATTERN = /^EBPS-\d{4}-(KG|G(?:[1-9]|1[0-2]))-\d{4}$/i
const TAZKIRA_PATTERN = /^\d{6,}$/

export class SearchStudentsHandler {
  private readonly listHandler: ListStudentsHandler

  constructor(private readonly studentRepository: IStudentRepository) {
    this.listHandler = new ListStudentsHandler(studentRepository)
  }

  public async execute(query: SearchStudentsQuery): Promise<SearchStudentsResponse> {
    const filters: StudentSearchFilters = { ...query.filters }
    const term = query.searchTerm?.trim()

    if (term) {
      if (ADMISSION_PATTERN.test(term)) {
        filters.admissionNumber = term.toUpperCase()
      } else if (TAZKIRA_PATTERN.test(term)) {
        filters.tazkiraNumber = term
      } else {
        filters.name = term
      }
    }

    // Delegate projection/pagination to the list handler for a consistent read model.
    return this.listHandler.execute({
      filters,
      pagination: query.pagination,
      requestedBy: query.requestedBy,
    })
  }
}
