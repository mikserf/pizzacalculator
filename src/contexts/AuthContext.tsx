import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { clearStoredSession, supabase } from '../lib/supabase';

interface AuthContextValue {
  /** False when the build has no Supabase keys: hide every login UI. */
  enabled: boolean;
  /** True until the stored session has been checked on page load. */
  loading: boolean;
  user: User | null;
  /** Private: the Google picture (only shown publicly if the user opts in). */
  googlePicture: string | null;
  /** Public profile; null while loading or when signed out. */
  profile: Profile | null;
  updateProfile: (changes: { nickname?: string | null; showPhoto?: boolean }) => Promise<ProfileResult>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export interface Profile {
  /** Public nickname; null until the user picks one (required to share pizzas). */
  nickname: string | null;
  /** Public picture: the Google picture if the user opted in, else null. */
  avatarUrl: string | null;
}

export type ProfileResult = 'ok' | 'taken' | 'invalid' | 'error';

/** Same rule as the database: 2–30 characters after trimming. */
// eslint-disable-next-line react-refresh/only-export-components
export const validNickname = (s: string) => {
  const t = s.trim();
  return t.length >= 2 && t.length <= 30;
};

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
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile({ nickname: data?.display_name ?? null, avatarUrl: data?.avatar_url ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const googlePicture = meta.avatar_url ?? meta.picture ?? null;

  const updateProfile = async (changes: { nickname?: string | null; showPhoto?: boolean }): Promise<ProfileResult> => {
    if (!supabase || !userId) return 'error';
    const patch: { display_name?: string | null; avatar_url?: string | null } = {};
    if (changes.nickname !== undefined) {
      const nick = changes.nickname?.trim() || null;
      if (nick !== null && !validNickname(nick)) return 'invalid';
      patch.display_name = nick;
    }
    if (changes.showPhoto !== undefined) patch.avatar_url = changes.showPhoto ? googlePicture : null;
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) {
      console.error('Error updating profile:', error);
      return error.code === '23505' ? 'taken' : error.code === '23514' ? 'invalid' : 'error';
    }
    setProfile((prev) => ({
      nickname: patch.display_name !== undefined ? patch.display_name : prev?.nickname ?? null,
      avatarUrl: patch.avatar_url !== undefined ? patch.avatar_url : prev?.avatarUrl ?? null,
    }));
    return 'ok';
  };

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
  const value: AuthContextValue = {
    enabled: !!supabase,
    loading,
    user,
    googlePicture,
    profile,
    updateProfile,
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
