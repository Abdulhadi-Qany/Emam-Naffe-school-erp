import type { StudentSearchFilters, PaginationOptions } from '@/src/domain/repositories'

export type SearchableFilters = Omit<
  StudentSearchFilters,
  'name' | 'admissionNumber' | 'tazkiraNumber'
>

/**
 * Free-text student search. The handler routes the term to the right field:
 * - "EBPS-..."   → admission number
 * - digits (6+)  → tazkira number
 * - anything else → name (Dari/Pashto/English via repository)
 */
export interface SearchStudentsQuery {
  searchTerm?: string
  filters?: SearchableFilters
  pagination?: PaginationOptions
  requestedBy: string
}
