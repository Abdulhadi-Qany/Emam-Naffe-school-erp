'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { dictionaries, type Dictionary, type Locale } from '@/lib/i18n'

interface LanguageContextValue {
  lang: Locale
  setLang: (lang: Locale) => void
  t: Dictionary
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: dictionaries.en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved === 'fa' || saved === 'ps') {
      setLangState(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (next: Locale) => {
    setLangState(next)
    localStorage.setItem('lang', next)
    document.documentElement.lang = next
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
