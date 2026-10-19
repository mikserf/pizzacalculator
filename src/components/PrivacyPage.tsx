import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const labelText = 'font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft dark:text-char-400';
const cardClass =
  'rounded-lg border border-paper-300 bg-paper-50 shadow-[0_1px_0_rgba(60,40,20,0.04),0_10px_24px_-14px_rgba(60,40,20,0.22)] dark:border-char-600 dark:bg-char-800 dark:shadow-none';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
      <h2 className="mb-2 font-display text-xl font-bold text-ink dark:text-char-100">{title}</h2>
      <div className="space-y-2 text-sm leading-6 text-ink-soft dark:text-char-300">{children}</div>
    </section>
  );
}

/** Privacy policy + account deletion (GDPR). */
const PrivacyPage: React.FC = () => {
  const { enabled, user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      localStorage.removeItem('selectedPizzas');
      navigate('/');
    } catch (e) {
      console.error(e);
      setError('Something went wrong and nothing was deleted. Please try again, or email us.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-display text-4xl font-bold text-ink sm:text-5xl dark:text-char-100">Privacy</h1>
        <p className="font-display text-lg italic text-ink-muted dark:text-char-400">
          What pizzacalculator.se stores, and how to remove it.
        </p>
      </div>

      <div className={`${cardClass} space-y-5 p-5 sm:p-8`}>
        <p className="text-sm leading-6 text-ink-soft dark:text-char-300">
          The calculator and Party Mode work without an account. Everything you do without signing in stays in your
          own browser (localStorage) and is never sent to us.
        </p>

        <Section title="If you sign in with Google">
          <p>We receive and store only:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>your name, email address and profile picture from Google, to show who is signed in;</li>
            <li>the pizzas you create (name, description and ingredients).</li>
          </ul>
          <p>
            We never see your Google password, and we don't use your data for advertising or share it with anyone.
          </p>
        </Section>

        <Section title="Where it is stored">
          <p>
            Accounts and pizzas are stored with Supabase, our data processor, on servers in the EU. Sign-in is handled
            by Google. The site itself is hosted on GitHub Pages and sets no tracking cookies.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can view and edit your pizzas in Party Mode at any time, and export them as a file. You can delete your
            account and all its data below. It takes effect immediately and cannot be undone.
          </p>
        </Section>

        {enabled && user && (
          <Section title="Delete my account and data">
            <p>
              This permanently deletes your account and every pizza saved to it. Pizzas saved only on this device are
              not affected.
            </p>
            <label htmlFor="confirm-delete" className={`mt-3 block ${labelText}`}>
              Type DELETE to confirm
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                id="confirm-delete"
                value={confirmText}
                autoComplete="off"
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-40 rounded-md border border-paper-400 bg-white/60 px-3 py-2 font-mono text-sm uppercase text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60 dark:text-char-100"
              />
              <button
                type="button"
                disabled={confirmText.trim().toUpperCase() !== 'DELETE' || busy}
                onClick={handleDelete}
                className="rounded-full bg-brand-700 px-5 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-50 transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 font-display text-sm italic text-brand-700 dark:text-brand-300">
                {error}
              </p>
            )}
          </Section>
        )}
      </div>
    </div>
  );
};

export default PrivacyPage;
