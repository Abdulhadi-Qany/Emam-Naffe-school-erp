/**
 * Money helpers for AFN (Afghani) amounts.
 *
 * The database stores money in `numeric` columns which the `pg` driver returns
 * as strings. These helpers normalize inbound input to 2dp strings and give
 * endpoints a single place for arithmetic.
 */

/** Parses any inbound money value (number, numeric string, undefined) into a number. */
export function num(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Formats a number as a 2dp decimal string for `numeric` columns. */
export function money(value: number | string | unknown): string {
  const parsed = num(value)
  return (Math.round(parsed * 100) / 100).toFixed(2)
}

/** Rounds to 2 decimal places, keeping the result a JS number. */
export function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Validates and normalizes every money field of a request body.
 * Throws a tagged error (caught by route handlers and mapped to 400) when a
 * value is present but not a non-negative finite number.
 */
export class MoneyValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MoneyValidationError'
  }
}

export function normalizeMoney(value: unknown, field: string): string {
  if (value === undefined || value === null || value === '') return '0'
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new MoneyValidationError(`${field} must be a non-negative number`)
  }
  return money(parsed)
}

/** Normalizes an explicit list of money fields on a body object. */
export function moneyFields(body: Record<string, unknown>, fields: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const field of fields) {
    result[field] = normalizeMoney(body[field], field)
  }
  return result
}

/** Sums values that may be numbers or numeric strings. */
export function sum(values: readonly (number | string | null | undefined)[]): number {
  return round(values.reduce<number>((total, value) => total + num(value), 0))
}
