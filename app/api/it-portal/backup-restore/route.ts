import { systemBackups } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: systemBackups,
  module: 'settings',
  label: 'Backup',
  requiredFields: ['storageRef'],
  uniqueFields: [],
  searchableFields: ['scope', 'storageRef'],
  filterFields: ['status', 'scope'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
