import { en } from './en'
import { fa } from './fa'
import { ps } from './ps'

export type { Dictionary } from './en'
export type Locale = keyof typeof dictionaries

export const dictionaries = {
  en,
  fa,
  ps,
} as const

export const localeMap: Record<Locale, string> = {
  en: 'en-GB',
  fa: 'fa-AF',
  ps: 'ps-AF',
}

export function getDictionary(lang: Locale) {
  return dictionaries[lang]
}
