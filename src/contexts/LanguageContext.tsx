import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from '../types/party';

const STORAGE_KEY = 'pizzaLang';

/** Saved choice first; otherwise Swedish for Swedish browsers, English for everyone else. */
const initialLang = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'sv' || saved === 'en') return saved;
  } catch {
    /* storage blocked — fall through to the browser language */
  }
  const prefs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  return prefs.some((l) => /^(sv|nb|nn|no|da)\b/i.test(l)) ? 'sv' : 'en';
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* not remembered, but still switches */
    }
  };

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
