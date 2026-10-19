import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { clearStoredSession, supabase } from '../lib/supabase';

interface AuthContextValue {
  /** False when the build has no Supabase keys: hide every login UI. */
  enabled: boolean;
  /** True until the stored session has been checked on page load. */
  loading: boolean;
  user: User | null;
  displayName: string | null;
  avatarUrl: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  /**
   * Sign out of this browser only (Supabase's default also logs out every other
   * device). If the server refuses — e.g. the session was already revoked
   * elsewhere — forget the stored login anyway so the button always works.
   */
  const signOutHere = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      console.warn('Sign-out was refused by the server; clearing the local session.', error.message);
      clearStoredSession();
      window.location.reload();
    }
  };
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;

  const value: AuthContextValue = {
    enabled: !!supabase,
    loading,
    user,
    displayName: meta.full_name ?? meta.name ?? user?.email ?? null,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
    signInWithGoogle: async () => {
      if (!supabase) return;
      // Come back to the page the user was on.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          // Always show Google's account chooser, so people with several accounts can pick one.
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
    },
    signOut: signOutHere,
    deleteAccount: async () => {
      if (!supabase || !user) return;
      // Storage files can't be removed from SQL, so delete the photos first.
      const bucket = supabase.storage.from('pizza-images');
      const { data: files } = await bucket.list(user.id, { limit: 1000 });
      if (files && files.length > 0) {
        const { error: removeError } = await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
        if (removeError) throw removeError;
      }
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await signOutHere();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
