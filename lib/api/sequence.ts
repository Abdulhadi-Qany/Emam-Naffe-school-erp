/**
 * Race-safe business number allocation.
 *
 * `number_sequences` holds one row per (school, key). Allocation is a single
 * atomic upsert (`INSERT … ON CONFLICT DO UPDATE SET value = value + 1
 * RETURNING value`), which is safe under concurrency — unlike the previous
 * `count(*)`-based approach used by payroll slip numbering.
 *
 * Usage:
 * ```ts
 * const seq = await nextInSequence('invoice', schoolId, tx)
 * const invoiceNumber = generateInvoiceNumber(academicYear, seq)
 * ```
 */

import { db } from '@/lib/db'
import { numberSequences } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import type { PgDatabase, PgTransaction } from 'drizzle-orm/pg-core'

/** Any executor that can insert: the shared `db` or a transaction handle. */
export type SequenceExecutor =
  | PgDatabase<any, any, any>
  | PgTransaction<any, any, any>

/** Allocates the next value for a (school, key) pair. */
export async function nextInSequence(
  key: string,
  schoolId: string,
  executor: SequenceExecutor = db
): Promise<number> {
  const [row] = await executor
    .insert(numberSequences)
    .values({ id: crypto.randomUUID(), schoolId, key, value: 1 })
    .onConflictDoUpdate({
      target: [numberSequences.schoolId, numberSequences.key],
      set: { value: sql`${numberSequences.value} + 1`, updatedAt: new Date() },
    })
    .returning({ value: numberSequences.value })

  return row?.value ?? 1
}

/** Reads the current value without incrementing (0 when never used). */
export async function peekSequence(
  key: string,
  schoolId: string,
  executor: SequenceExecutor = db
): Promise<number> {
  const [row] = await executor
    .select({ value: numberSequences.value })
    .from(numberSequences)
    .where(sql`${numberSequences.schoolId} = ${schoolId} and ${numberSequences.key} = ${key}`)
  return row?.value ?? 0
}

/**
 * Formats a sequence value with a prefix and zero padding:
 * `format(12, 'EBPS-EMP', 4) => 'EBPS-EMP-0012'`.
 */
export function formatSequence(value: number, prefix: string, padTo = 4): string {
  return `${prefix}-${String(value).padStart(padTo, '0')}`
}
