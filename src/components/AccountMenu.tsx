import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, LogIn, LogOut, Shield, UserRound } from 'lucide-react';
import { fetchIsAdmin } from '../lib/community';
import { useAuth } from '../contexts/AuthContext';

const pill =
  'inline-flex items-center gap-2 rounded-full border border-paper-400 px-3.5 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300';
const menuItem =
  'flex w-full items-center gap-2.5 rounded px-3 py-2 text-left font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-soft transition-colors hover:bg-paper-100 hover:text-brand-700 dark:text-char-300 dark:hover:bg-char-700 dark:hover:text-brand-300';

export function Avatar({ url, name, size = 'h-8 w-8' }: { url: string | null; name: string | null; size?: string }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${size} rounded-full border border-paper-400 object-cover dark:border-char-500`}
      />
    );
  }
  return (
    <span
      className={`${size} inline-flex items-center justify-center rounded-full bg-ink font-mono text-xs font-semibold uppercase text-paper-50 dark:bg-char-100 dark:text-char-900`}
    >
      {name?.trim()[0] ?? <UserRound className="h-4 w-4" aria-hidden="true" />}
    </span>
  );
}

/** Sign-in pill, or the signed-in user's avatar with a small menu. Renders nothing without Supabase keys. */
export function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { enabled, loading, user, displayName, avatarUrl, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchIsAdmin().then(setIsAdmin);
    else setIsAdmin(false);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!enabled || loading) return null;

  if (!user) {
    return (
      <button type="button" onClick={() => signInWithGoogle()} className={pill}>
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Sign in
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${displayName ?? 'signed in'}`}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full transition-shadow hover:ring-2 hover:ring-brand-400/40 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
      >
        <Avatar url={avatarUrl} name={displayName} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-paper-300 bg-paper-50 p-1.5 shadow-[0_10px_24px_-10px_rgba(60,40,20,0.35)] dark:border-char-600 dark:bg-char-800 dark:shadow-none"
        >
          <div className="border-b border-dashed border-paper-400 px-3 pb-2.5 pt-1.5 dark:border-char-500">
            <p className="truncate font-display text-base font-bold text-ink dark:text-char-100">{displayName}</p>
            {user.email && displayName !== user.email && (
              <p className="truncate font-mono text-[0.6875rem] text-ink-muted dark:text-char-400">{user.email}</p>
            )}
          </div>
          <div className="pt-1.5">
            <Link
              to="/privacy"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className={menuItem}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              Privacy &amp; account
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className={menuItem}
              >
                <Gavel className="h-4 w-4" aria-hidden="true" />
                Moderation
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className={menuItem}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
