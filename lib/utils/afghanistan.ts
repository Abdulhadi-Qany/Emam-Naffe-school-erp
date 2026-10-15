export type SolarHijriDate = {
  year: number
  month: number
  day: number
  weekday: number
}

export type GregorianDate = {
  year: number
  month: number
  day: number
  weekday: number
}

const PERSIAN_WEEKDAYS_DA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
const PERSIAN_WEEKDAYS_PS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
const PERSIAN_WEEKDAYS_EN = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const PERSIAN_MONTHS_DA = [
  'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
  'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'
]
const PERSIAN_MONTHS_PS = [
  'وری', 'غوږی', 'غبرګولی', 'چنګاښ', 'زمری', 'وږی',
  'تله', 'لړم', 'ليندۍ', 'مرغومی', 'سلواغه', 'کب'
]
const PERSIAN_MONTHS_EN = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'
]

// ---------------------------------------------------------------------------
// Gregorian <-> Solar Hijri conversion
//
// Uses the Borkowski algorithm published in "The Persian calendar for 3000
// years" (1996), as implemented by the MIT-licensed `jalaali-js` library.
// Exact for Solar Hijri years -61 … 3177 (roughly Gregorian 560 … 3798).
// ---------------------------------------------------------------------------

/** Solar Hijri years that begin a new 33-year leap cycle. */
const JALAALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
  1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
] as const

const MIN_SOLAR_HIJRI_YEAR = JALAALI_BREAKS[0]
const MAX_SOLAR_HIJRI_YEAR = JALAALI_BREAKS[JALAALI_BREAKS.length - 1] - 1

/** Truncating integer division, matching the reference implementation. */
function idiv(a: number, b: number): number {
  return ~~(a / b)
}

/** Mathematical modulo — non-negative for positive divisors. */
function imod(a: number, b: number): number {
  return a - ~~(a / b) * b
}

type JalCalCore = { gy: number; march: number; jump: number; n: number }

function assertSolarHijriYear(jy: number): void {
  if (!Number.isFinite(jy) || jy < MIN_SOLAR_HIJRI_YEAR || jy > MAX_SOLAR_HIJRI_YEAR) {
    throw new RangeError(`Solar Hijri year ${jy} is outside the supported range`)
  }
}

/**
 * Locates a Solar Hijri year inside the 33-year cycle table and computes the
 * Gregorian March day on which Farvardin 1 falls.
 */
function jalCalCore(jy: number): JalCalCore {
  assertSolarHijriYear(jy)
  const gy = jy + 621
  let leapJ = -14
  let jp: number = JALAALI_BREAKS[0]
  let jm = 0
  let jump = 0

  for (let i = 1; i < JALAALI_BREAKS.length; i += 1) {
    jm = JALAALI_BREAKS[i] as number
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + idiv(jump, 33) * 8 + idiv(imod(jump, 33), 4)
    jp = jm
  }
  const n = jy - jp
  leapJ = leapJ + idiv(n, 33) * 8 + idiv(imod(n, 33) + 3, 4)
  if (imod(jump, 33) === 4 && jump - n === 4) leapJ += 1

  const leapG = idiv(gy, 4) - idiv((idiv(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  return { gy, march, jump, n }
}

/** Years elapsed since the last leap year; 0 means the year itself is leap. */
function leapFromCycle(jump: number, n: number): number {
  let adjusted = n
  if (jump - n < 6) adjusted = n - jump + idiv(jump + 4, 33) * 33
  let leap = imod(imod(adjusted + 1, 33) - 1, 4)
  if (leap === -1) leap = 4
  return leap
}

/** Gregorian date -> Julian day number. */
function g2d(gy: number, gm: number, gd: number): number {
  let d = idiv((gy + idiv(gm - 8, 6) + 100100) * 1461, 4) + idiv(153 * imod(gm + 9, 12) + 2, 5) + gd - 34840408
  d = d - idiv(idiv(gy + 100100 + idiv(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

/** Julian day number -> Gregorian date. */
function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631
  j = j + idiv(idiv(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = idiv(imod(j, 1461), 4) * 5 + 308
  const gd = idiv(imod(i, 153), 5) + 1
  const gm = imod(idiv(i, 153), 12) + 1
  const gy = idiv(j, 1461) - 100100 + idiv(8 - gm, 6)
  return { gy, gm, gd }
}

/** Solar Hijri date -> Julian day number. */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCalCore(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - idiv(jm, 7) * (jm - 7) + jd - 1
}

/** Julian day number -> Solar Hijri date. */
function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy
  const jy = Math.min(gy - 621, MAX_SOLAR_HIJRI_YEAR)
  const r = jalCalCore(jy)
  const jdn1f = g2d(r.gy, 3, r.march)

  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      // The first six months have 31 days each.
      return { jy, jm: 1 + idiv(k, 31), jd: imod(k, 31) + 1 }
    }
    k -= 186
  } else {
    // The date falls in the previous Solar Hijri year.
    const previousJy = jy - 1
    assertSolarHijriYear(previousJy)
    k += 179
    if (leapFromCycle(r.jump, r.n) === 1) k += 1
    return { jy: previousJy, jm: 7 + idiv(k, 30), jd: imod(k, 30) + 1 }
  }
  return { jy, jm: 7 + idiv(k, 30), jd: imod(k, 30) + 1 }
}


/**
 * Convert Gregorian date to Solar Hijri date
 */
export function gregorianToSolarHijri(year: number, month: number, day: number): SolarHijriDate {
  const { jy, jm, jd } = d2j(g2d(year, month, day))
  return {
    year: jy,
    month: jm,
    day: jd,
    // Saturday = 0 for the Afghan week (Sunday..Friday = 1..6)
    weekday: (new Date(year, month - 1, day).getDay() + 1) % 7,
  }
}

/**
 * Convert Solar Hijri date to Gregorian date
 */
export function solarHijriToGregorian(year: number, month: number, day: number): GregorianDate {
  const { gy, gm, gd } = d2g(j2d(year, month, day))
  return {
    year: gy,
    month: gm,
    day: gd,
    weekday: new Date(gy, gm - 1, gd).getDay(),
  }
}

/**
 * Get Solar Hijri weekday (0 = Saturday for Afghan week)
 */
export function getSolarHijriWeekday(year: number, month: number, day: number): number {
  const g = solarHijriToGregorian(year, month, day)
  return (g.weekday + 1) % 7
}

/**
 * Format Solar Hijri date in Dari
 */
export function formatSolarHijriDari(date: SolarHijriDate, format: 'short' | 'long' | 'full' = 'long'): string {
  const weekday = PERSIAN_WEEKDAYS_DA[date.weekday]
  const month = PERSIAN_MONTHS_DA[date.month - 1]

  switch (format) {
    case 'short':
      return `${date.year}/${String(date.month).padStart(2, '0')}/${String(date.day).padStart(2, '0')}`
    case 'long':
      return `${weekday}، ${date.day} ${month} ${date.year}`
    case 'full':
      return `${weekday}، ${date.day} ${month} ${date.year} (${PERSIAN_MONTHS_EN[date.month - 1]})`
    default:
      return formatSolarHijriDari(date, 'long')
  }
}

/**
 * Format Solar Hijri date in Pashto
 */
export function formatSolarHijriPashto(date: SolarHijriDate, format: 'short' | 'long' | 'full' = 'long'): string {
  const weekday = PERSIAN_WEEKDAYS_PS[date.weekday]
  const month = PERSIAN_MONTHS_PS[date.month - 1]

  switch (format) {
    case 'short':
      return `${date.year}/${String(date.month).padStart(2, '0')}/${String(date.day).padStart(2, '0')}`
    case 'long':
      return `${weekday}، ${date.day} ${month} ${date.year}`
    case 'full':
      return `${weekday}، ${date.day} ${month} ${date.year} (${PERSIAN_MONTHS_EN[date.month - 1]})`
    default:
      return formatSolarHijriPashto(date, 'long')
  }
}

/**
 * Format Solar Hijri date in English
 */
export function formatSolarHijriEnglish(date: SolarHijriDate): string {
  const weekday = PERSIAN_WEEKDAYS_EN[date.weekday]
  const month = PERSIAN_MONTHS_EN[date.month - 1]
  return `${weekday}, ${date.day} ${month} ${date.year}`
}

/**
 * Format Solar Hijri date based on language
 */
export function formatSolarHijri(date: SolarHijriDate, lang: 'da' | 'ps' | 'en' = 'da', format: 'short' | 'long' | 'full' = 'long'): string {
  switch (lang) {
    case 'da':
      return formatSolarHijriDari(date, format)
    case 'ps':
      return formatSolarHijriPashto(date, format)
    case 'en':
      return formatSolarHijriEnglish(date)
    default:
      return formatSolarHijriDari(date, format)
  }
}

/**
 * Convert Date to Solar Hijri
 */
export function dateToSolarHijri(date: Date): SolarHijriDate {
  return gregorianToSolarHijri(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/**
 * Convert Solar Hijri to Date
 */
export function solarHijriToDate(sh: SolarHijriDate): Date {
  const g = solarHijriToGregorian(sh.year, sh.month, sh.day)
  return new Date(g.year, g.month - 1, g.day)
}

/**
 * Get current Solar Hijri date
 */
export function getCurrentSolarHijri(): SolarHijriDate {
  return dateToSolarHijri(new Date())
}

/**
 * Get Solar Hijri month name
 */
export function getSolarHijriMonthName(month: number, lang: 'da' | 'ps' | 'en' = 'da'): string {
  if (lang === 'da') return PERSIAN_MONTHS_DA[month - 1]
  if (lang === 'ps') return PERSIAN_MONTHS_PS[month - 1]
  return PERSIAN_MONTHS_EN[month - 1]
}

/**
 * Get Solar Hijri weekday name
 */
export function getSolarHijriWeekdayName(weekday: number, lang: 'da' | 'ps' | 'en' = 'da'): string {
  if (lang === 'da') return PERSIAN_WEEKDAYS_DA[weekday]
  if (lang === 'ps') return PERSIAN_WEEKDAYS_PS[weekday]
  return PERSIAN_WEEKDAYS_EN[weekday]
}

/**
 * Check if Solar Hijri year is leap
 */
export function isSolarHijriLeapYear(year: number): boolean {
  assertSolarHijriYear(year)
  const { jump, n } = jalCalCore(year)
  return leapFromCycle(jump, n) === 0
}

/**
 * Get days in Solar Hijri month
 */
export function getSolarHijriDaysInMonth(year: number, month: number): number {
  if (month < 7) return 31
  if (month < 12) return 30
  return isSolarHijriLeapYear(year) ? 30 : 29
}

/**
 * Get Afghan academic year from date
 * Academic year in Afghanistan starts in Farvardin (March)
 */
export function getAfghanAcademicYear(date: Date = new Date()): number {
  const sh = dateToSolarHijri(date)
  // Academic year starts in Farvardin (month 1)
  return sh.month >= 1 ? sh.year : sh.year - 1
}

/**
 * Format AFN currency
 */
export function formatAFN(amount: number, lang: 'da' | 'ps' | 'en' = 'da'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  
  if (lang === 'da' || lang === 'ps') {
    return `؋${formatted}`
  }
  return `AFN ${formatted}`
}

/**
 * Format Afghan phone number
 */
export function formatAfghanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('93')) {
    return `+${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

/**
 * Parse Tazkira number
 */
export function parseTazkira(tazkira: string): { number: string; province?: string; district?: string } | null {
  // Afghan Tazkira format: 13 digits
  // First 2: Province, Next 2: District, Next 2: Year, Last 7: Sequence
  const cleaned = tazkira.replace(/\D/g, '')
  if (cleaned.length !== 13) return null
  
  return {
    number: cleaned,
    province: cleaned.slice(0, 2),
    district: cleaned.slice(2, 4),
  }
}

/**
 * Generate student admission number
 */
export function generateAdmissionNumber(
  academicYear: number,
  grade: number,
  sequence: number
): string {
  return `EBPS-${academicYear}-G${grade}-${String(sequence).padStart(4, '0')}`
}

/**
 * Generate employee ID
 */
export function generateEmployeeId(academicYear: number, sequence: number): string {
  return `EBPS-EMP-${academicYear}-${String(sequence).padStart(4, '0')}`
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(academicYear: number, sequence: number): string {
  return `EBPS-INV-${academicYear}-${String(sequence).padStart(4, '0')}`
}

/**
 * Generate receipt number
 */
export function generateReceiptNumber(academicYear: number, sequence: number): string {
  return `EBPS-RCP-${academicYear}-${String(sequence).padStart(4, '0')}`
}