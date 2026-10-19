import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { fetchIsAdmin, fetchModeration, ModerationItem, setHidden } from '../lib/community';
import { photoUrl } from '../lib/photos';
import { useAuth } from '../contexts/AuthContext';
import { cardClass, labelText, pillOutline, pillSolid } from '../lib/styles';
import { useLang } from '../hooks/useLang';

const T = {
  sv: {
    title: 'Moderering',
    subtitle: 'Anmälda och dolda communitypizzor.',
    adminsOnly: 'Den här sidan är bara för administratörer.',
    loadError: 'Kunde inte ladda modereringslistan.',
    updateError: 'Kunde inte uppdatera pizzan.',
    nothing: 'Inget att granska. 🍕',
    by: 'av',
    unknown: 'okänd',
    hidden: 'Dold',
    visible: 'Synlig i communityn',
    notShared: 'Inte delad',
    reports: (n: number) => `${n} ${n === 1 ? 'öppen anmälan' : 'öppna anmälningar'}`,
    unhide: 'Visa igen',
    hide: 'Dölj',
    keep: 'Behåll (avfärda anmälningar)',
    open: 'Öppna',
  },
  en: {
    title: 'Moderation',
    subtitle: 'Reported and hidden community pizzas.',
    adminsOnly: 'This page is for admins only.',
    loadError: "Couldn't load the moderation list.",
    updateError: "Couldn't update that pizza.",
    nothing: 'Nothing to review. 🍕',
    by: 'by',
    unknown: 'unknown',
    hidden: 'Hidden',
    visible: 'Visible in community',
    notShared: 'Not shared',
    reports: (n: number) => `${n} open ${n === 1 ? 'report' : 'reports'}`,
    unhide: 'Unhide',
    hide: 'Hide',
    keep: 'Keep (dismiss reports)',
    open: 'Open',
  },
} as const;

/** Moderation queue: reported pizzas and hidden pizzas. Admins only (enforced in the database too). */
const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const t = T[useLang()];
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetchModeration()
      .then(setItems)
      .catch((err) => {
        console.error(err);
        setError(t.loadError);
      });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    fetchIsAdmin().then((admin) => {
      setIsAdmin(admin);
      if (admin) load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const act = async (item: ModerationItem, hide: boolean) => {
    setBusy(item.pizzaId);
    setError(null);
    try {
      await setHidden(item.pizzaId, hide);
      await load();
    } catch (err) {
      console.error(err);
      setError(t.updateError);
    } finally {
      setBusy(null);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ink-muted dark:text-char-400" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-display text-4xl font-bold text-ink dark:text-char-100">{t.title}</h1>
        <p className="font-display text-lg italic text-ink-muted dark:text-char-400">
          {t.subtitle}
        </p>
      </div>

      {!isAdmin ? (
        <p className="text-center font-display italic text-ink-muted dark:text-char-400">{t.adminsOnly}</p>
      ) : (
        <div className="space-y-4">
          {error && (
            <p role="alert" className="text-center font-display italic text-brand-700 dark:text-brand-300">
              {error}
            </p>
          )}
          {items.length === 0 && (
            <p className="rounded-md border border-dashed border-paper-400 px-6 py-10 text-center font-display italic text-ink-muted dark:border-char-500 dark:text-char-400">
              {t.nothing}
            </p>
          )}
          {items.map((item) => (
            <div key={item.pizzaId} className={`${cardClass} flex flex-col gap-4 p-4 sm:flex-row`}>
              {item.imagePath && (
                <img
                  src={photoUrl(item.imagePath)}
                  alt=""
                  className="aspect-[3/2] w-full shrink-0 rounded border border-paper-300 object-cover sm:w-40 dark:border-char-600"
                />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-lg font-bold text-ink dark:text-char-100">{item.name}</h2>
                  <span className="text-sm text-ink-muted dark:text-char-400">{t.by} {item.authorName ?? t.unknown}</span>
                </div>
                <p className={labelText}>
                  {item.hidden ? t.hidden : item.isPublic ? t.visible : t.notShared} · {t.reports(item.openReports)}
                </p>
                {item.reasons.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft dark:text-char-300">
                    {item.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.hidden ? (
                    <button type="button" disabled={busy === item.pizzaId} onClick={() => act(item, false)} className={pillOutline}>
                      {t.unhide}
                    </button>
                  ) : (
                    <>
                      <button type="button" disabled={busy === item.pizzaId} onClick={() => act(item, true)} className={pillSolid}>
                        {t.hide}
                      </button>
                      <button type="button" disabled={busy === item.pizzaId} onClick={() => act(item, false)} className={pillOutline}>
                        {t.keep}
                      </button>
                    </>
                  )}
                  {!item.hidden && item.isPublic && (
                    <Link to={`/pizza/${item.pizzaId}`} className={pillOutline}>
                      {t.open}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
