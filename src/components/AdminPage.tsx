import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { fetchIsAdmin, fetchModeration, ModerationItem, setHidden } from '../lib/community';
import { photoUrl } from '../lib/photos';
import { useAuth } from '../contexts/AuthContext';
import { cardClass, labelText, pillOutline, pillSolid } from '../lib/styles';

/** Moderation queue: reported pizzas and hidden pizzas. Admins only (enforced in the database too). */
const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetchModeration()
      .then(setItems)
      .catch((err) => {
        console.error(err);
        setError("Couldn't load the moderation list.");
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
  }, [user, authLoading]);

  const act = async (item: ModerationItem, hide: boolean) => {
    setBusy(item.pizzaId);
    setError(null);
    try {
      await setHidden(item.pizzaId, hide);
      await load();
    } catch (err) {
      console.error(err);
      setError("Couldn't update that pizza.");
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
        <h1 className="mb-2 font-display text-4xl font-bold text-ink dark:text-char-100">Moderation</h1>
        <p className="font-display text-lg italic text-ink-muted dark:text-char-400">
          Reported and hidden community pizzas.
        </p>
      </div>

      {!isAdmin ? (
        <p className="text-center font-display italic text-ink-muted dark:text-char-400">This page is for admins only.</p>
      ) : (
        <div className="space-y-4">
          {error && (
            <p role="alert" className="text-center font-display italic text-brand-700 dark:text-brand-300">
              {error}
            </p>
          )}
          {items.length === 0 && (
            <p className="rounded-md border border-dashed border-paper-400 px-6 py-10 text-center font-display italic text-ink-muted dark:border-char-500 dark:text-char-400">
              Nothing to review. 🍕
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
                  <span className="text-sm text-ink-muted dark:text-char-400">by {item.authorName ?? 'unknown'}</span>
                </div>
                <p className={labelText}>
                  {item.hidden ? 'Hidden' : item.isPublic ? 'Visible in community' : 'Not shared'} ·{' '}
                  {item.openReports} open {item.openReports === 1 ? 'report' : 'reports'}
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
                      Unhide
                    </button>
                  ) : (
                    <>
                      <button type="button" disabled={busy === item.pizzaId} onClick={() => act(item, true)} className={pillSolid}>
                        Hide
                      </button>
                      <button type="button" disabled={busy === item.pizzaId} onClick={() => act(item, false)} className={pillOutline}>
                        Keep (dismiss reports)
                      </button>
                    </>
                  )}
                  {!item.hidden && item.isPublic && (
                    <Link to={`/pizza/${item.pizzaId}`} className={pillOutline}>
                      Open
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
