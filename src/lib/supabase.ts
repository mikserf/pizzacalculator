import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * The Supabase client, or null when the app is built without keys. Every
 * caller must handle null — the app then runs in local-only mode (no login).
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
      })
    : null;

/** Forget the login stored in this browser (used when the server refuses a sign-out). */
export function clearStoredSession(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-') && k.includes('-auth-token'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage blocked — nothing stored to clear */
  }
}
