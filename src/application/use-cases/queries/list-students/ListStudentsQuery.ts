import type { StudentSearchFilters, PaginationOptions } from '@/src/domain/repositories'

export interface ListStudentsQuery {
  filters?: StudentSearchFilters
  pagination?: PaginationOptions
  requestedBy: string
}
