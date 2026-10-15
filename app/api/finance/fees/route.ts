import { GET, POST } from '@/app/api/finance/fee-structures/route'

/**
 * Alias: `/api/finance/fees` → the canonical `/api/finance/fee-structures`
 * collection (the schema has no separate `fees` table).
 */
export { GET, POST }
