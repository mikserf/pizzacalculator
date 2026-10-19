import { useState } from 'react';
import type { Lang } from '../types/party';

/** The Svenska/English choice made in Party Mode (stored per browser). */
export function useLang(): Lang {
  const [lang] = useState<Lang>(() => {
    try {
      return localStorage.getItem('pizzaLang') === 'en' ? 'en' : 'sv';
    } catch {
      return 'sv';
    }
  });
  return lang;
}
