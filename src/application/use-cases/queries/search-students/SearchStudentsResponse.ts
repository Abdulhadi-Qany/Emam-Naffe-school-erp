import type { PaginatedResult } from '@/src/domain/repositories'
import type { StudentListItem } from '../list-students/ListStudentsResponse'

export type { StudentListItem }
export type SearchStudentsResponse = PaginatedResult<StudentListItem>
