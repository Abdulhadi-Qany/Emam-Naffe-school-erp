/**
 * Afghan calendar / academic-year helpers shared by API routes.
 *
 * Storage is always Gregorian (`timestamptz`); Solar Hijri labels are derived
 * here so period labels (payroll, fee terms, report headers) are consistent
 * with the client-side calendar utilities.
 */

import { dateToSolarHijri, type SolarHijriDate } from '@/lib/utils/afghanistan'

/** Academic year starts in Farvardin (month 1) — e.g. April 2025 is still 1403. */
export function afghanAcademicYear(date: Date = new Date()): number {
  const sh = dateToSolarHijri(date)
  return sh.month >= 1 ? sh.year : sh.year - 1
}

/** 4-digit academic year label, e.g. `1403`. */
export function academicYearLabel(date: Date = new Date()): string {
  return String(afghanAcademicYear(date))
}

/** Solar Hijri `YYYY-MM` label for a date — used for payroll period labels. */
export function solarMonthLabel(date: Date): string {
  const sh = dateToSolarHijri(date)
  return `${sh.year}-${String(sh.month).padStart(2, '0')}`
}

export function solarDateLabel(date: Date): string {
  const sh = dateToSolarHijri(date)
  return `${sh.year}-${String(sh.month).padStart(2, '0')}-${String(sh.day).padStart(2, '0')}`
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

/** `YYYY-MM-DD` in local time (NOT `toISOString`, which shifts by timezone). */
export function isoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface DateRange {
  from: Date
  to: Date
}

/**
 * Parses `from`/`to` query params, defaulting to the last `defaultDays` days.
 * Values may be `YYYY-MM-DD` or full ISO datetimes. Swapped ranges are
 * normalised (from ≤ to).
 */
export function parseDateRange(
  params: URLSearchParams,
  defaultDays = 30,
  now: Date = new Date()
): DateRange {
  const rawFrom = params.get('from')
  const rawTo = params.get('to')
  const fallbackFrom = startOfDay(new Date(now.getTime() - (defaultDays - 1) * 86_400_000))
  const from = rawFrom ? startOfDay(new Date(rawFrom)) : fallbackFrom
  const to = rawTo ? endOfDay(new Date(rawTo)) : endOfDay(now)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error('from/to must be valid dates (YYYY-MM-DD)')
  }
  return from <= to ? { from, to } : { from: to, to: from }
}

/** Inclusive whole-month range — used by monthly finance/exam reports. */
export function parseMonthRange(params: URLSearchParams, now: Date = new Date()): DateRange {
  const month = params.get('month') // `YYYY-MM`
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return parseDateRange(params, 30, now)
  const [year, monthIndex] = month.split('-').map(Number)
  const from = new Date(year, monthIndex - 1, 1)
  const to = endOfDay(new Date(year, monthIndex, 0))
  return { from, to }
}

/** Solar Hijri academic year → Gregorian academic year bounds (helps term seeding). */
export function academicYearBounds(solarYear: number): DateRange {
  // Farvardin 1 ≈ March 21 of solarYear - 621
  const from = new Date(solarYear - 621, 2, 21)
  const to = endOfDay(new Date(solarYear - 620, 2, 20))
  return { from, to }
}

export type { SolarHijriDate }
