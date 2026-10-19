import type { Lang } from '../types/party';
import { useLanguage } from '../contexts/LanguageContext';

/** The site-wide Svenska/English choice (switched in the top menu). */
export function useLang(): Lang {
  return useLanguage().lang;
}
