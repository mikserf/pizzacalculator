import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth, validNickname } from '../contexts/AuthContext';
import { useLang } from '../hooks/useLang';
import { cardClass, labelText, pillOutline, pillSolid } from '../lib/styles';
import { Avatar } from './AccountMenu';

const T = {
  sv: {
    title: 'Konto',
    subtitle: 'Så visas du för andra i communityn.',
    signedOut: 'Logga in för att se dina kontoinställningar.',
    signIn: 'Logga in',
    nickname: 'Smeknamn',
    nicknameHint: 'Visas bredvid pizzor du delar. Ditt Google-namn visas aldrig.',
    nicknamePlaceholder: 't.ex. PizzaKim',
    noNickname: 'Inget smeknamn än — du väljer ett när du delar din första pizza.',
    save: 'Spara',
    saved: 'Sparat.',
    taken: 'Det smeknamnet är redan taget — prova ett annat.',
    invalid: 'Smeknamnet måste vara 2–30 tecken.',
    error: 'Kunde inte spara. Försök igen.',
    photo: 'Profilbild',
    photoToggle: 'Visa min Google-profilbild vid pizzor jag delar',
    photoOff: 'Av — en bokstav visas istället.',
    photoNone: 'Ditt Google-konto har ingen profilbild.',
    preview: 'Så här ser det ut',
    privacy: 'Integritet och radering av konto',
    signedInAs: 'Inloggad som',
    onlyYou: '(syns bara för dig)',
  },
  en: {
    title: 'Account',
    subtitle: 'How you appear to others in the community.',
    signedOut: 'Sign in to see your account settings.',
    signIn: 'Sign in',
    nickname: 'Nickname',
    nicknameHint: 'Shown next to pizzas you share. Your Google name is never shown.',
    nicknamePlaceholder: 'e.g. PizzaKim',
    noNickname: "No nickname yet — you'll choose one when you share your first pizza.",
    save: 'Save',
    saved: 'Saved.',
    taken: 'That nickname is taken — try another one.',
    invalid: 'Nicknames must be 2–30 characters.',
    error: "Couldn't save. Try again.",
    photo: 'Profile picture',
    photoToggle: 'Show my Google profile picture next to pizzas I share',
    photoOff: 'Off — a letter is shown instead.',
    photoNone: 'Your Google account has no profile picture.',
    preview: 'Preview',
    privacy: 'Privacy and account deletion',
    signedInAs: 'Signed in as',
    onlyYou: '(only visible to you)',
  },
} as const;

const inputClass =
  'w-full rounded-md border border-paper-400 bg-white/60 px-3 py-2.5 text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60 dark:text-char-100';

const AccountPage = () => {
  const t = T[useLang()];
  const { enabled, loading, user, profile, googlePicture, updateProfile, signInWithGoogle } = useAuth();
  const [nick, setNick] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setNick(profile?.nickname ?? ''), [profile?.nickname]);

  if (loading || (user && !profile)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ink-muted dark:text-char-400" aria-label="Loading" />
      </div>
    );
  }

  if (!enabled || !user || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="mb-4 font-display text-lg italic text-ink-muted dark:text-char-400">{t.signedOut}</p>
        {enabled && (
          <button type="button" onClick={() => signInWithGoogle()} className={pillSolid}>
            {t.signIn}
          </button>
        )}
      </div>
    );
  }

  const saveNick = async () => {
    if (!validNickname(nick)) {
      setStatus(t.invalid);
      return;
    }
    setBusy(true);
    const res = await updateProfile({ nickname: nick });
    setBusy(false);
    setStatus(res === 'ok' ? t.saved : t[res]);
  };

  const showPhoto = !!profile.avatarUrl;
  const changed = nick.trim() !== (profile.nickname ?? '');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-display text-4xl font-bold text-ink sm:text-5xl dark:text-char-100">{t.title}</h1>
        <p className="font-display text-lg italic text-ink-muted dark:text-char-400">{t.subtitle}</p>
      </div>

      <div className={`${cardClass} space-y-6 p-5 sm:p-8`}>
        {/* Nickname */}
        <section>
          <label htmlFor="nickname" className={`mb-2 block ${labelText}`}>
            {t.nickname}
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="nickname"
              value={nick}
              maxLength={30}
              placeholder={t.nicknamePlaceholder}
              onChange={(e) => {
                setNick(e.target.value);
                setStatus(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && changed && saveNick()}
              className={`${inputClass} min-w-0 flex-1 font-display text-lg font-bold`}
            />
            <button type="button" onClick={saveNick} disabled={busy || !changed} className={pillSolid}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {t.save}
            </button>
          </div>
          <p className="mt-2 font-display text-sm italic text-ink-muted dark:text-char-400">
            {status ?? (profile.nickname ? t.nicknameHint : t.noNickname)}
          </p>
        </section>

        {/* Picture */}
        <section className="border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
          <h2 className={`mb-3 ${labelText}`}>{t.photo}</h2>
          {googlePicture ? (
            <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-paper-400 px-4 py-3 dark:border-char-500">
              <span className="text-sm font-medium text-ink dark:text-char-100">{t.photoToggle}</span>
              <button
                type="button"
                role="switch"
                aria-checked={showPhoto}
                aria-label={t.photoToggle}
                onClick={async () => {
                  const res = await updateProfile({ showPhoto: !showPhoto });
                  setStatus(res === 'ok' ? null : t.error);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  showPhoto ? 'bg-brand-600 dark:bg-brand-400' : 'bg-paper-400 dark:bg-char-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    showPhoto ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ) : (
            <p className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.photoNone}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <span className={labelText}>{t.preview}:</span>
            <Avatar url={profile.avatarUrl} name={profile.nickname ?? '?'} size="h-8 w-8" />
            <span className="text-sm text-ink-soft dark:text-char-300">{profile.nickname ?? '—'}</span>
          </div>
        </section>

        {/* Private info + links */}
        <section className="space-y-3 border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
          <p className="text-sm text-ink-soft dark:text-char-300">
            {t.signedInAs} <span className="font-mono">{user.email}</span>{' '}
            <span className="font-display italic text-ink-muted dark:text-char-400">{t.onlyYou}</span>
          </p>
          <Link to="/privacy" className={pillOutline}>
            {t.privacy}
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AccountPage;
