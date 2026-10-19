import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, EyeOff, Flag, Loader2, PartyPopper } from 'lucide-react';
import type { CommunityPizza, PartyPizza } from '../types/party';
import {
  addToParty,
  fetchCommunityPizza,
  fetchIsAdmin,
  fetchMyRating,
  reportPizza,
  setHidden,
  setMyRating,
} from '../lib/community';
import { photoUrl } from '../lib/photos';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../hooks/useLang';
import { newPizzaId, usePizzaStore } from '../hooks/usePizzaStore';
import { cardClass, labelText, pillOutline, pillSolid, quietLink } from '../lib/styles';
import RatingStars from './RatingStars';
import { Avatar } from './AccountMenu';

const T = {
  sv: {
    back: 'Community',
    notFound: 'Den här pizzan finns inte längre i communityn.',
    error: 'Kunde inte ladda pizzan. Försök igen.',
    ingredients: 'Ingredienser',
    perPizza: 'per pizza',
    addToParty: 'Lägg till i min fest',
    copy: 'Kopiera till mina pizzor',
    copied: 'Kopierad till Mina pizzor i Party Mode.',
    copyName: (n: string) => `${n} (kopia)`,
    copyFailed: 'Kunde inte kopiera pizzan. Försök igen.',
    yourRating: 'Ditt betyg',
    rate: 'Betygsätt',
    removeRating: 'Ta bort betyg',
    signInToRate: 'Logga in för att betygsätta',
    ownPizza: 'Det här är din pizza — andra kan betygsätta den.',
    rateFailed: 'Kunde inte spara betyget. Försök igen.',
    ratings: (n: number) => `${n} betyg`,
    noRatings: 'Inga betyg än — bli först!',
    report: 'Anmäl',
    reportTitle: 'Anmäl pizzan',
    reportHint: 'Vad är fel? (t.ex. stötande bild, spam, inte en pizza)',
    send: 'Skicka',
    cancel: 'Avbryt',
    reported: 'Tack — en moderator tittar på det.',
    alreadyReported: 'Du har redan anmält den här pizzan.',
    reportFailed: 'Kunde inte skicka anmälan. Försök igen.',
    hide: 'Dölj (admin)',
    hidden: 'Dold från communityn.',
    by: 'av',
    anonymous: 'Pizzabagare',
  },
  en: {
    back: 'Community',
    notFound: 'This pizza is no longer in the community.',
    error: "Couldn't load the pizza. Try again.",
    ingredients: 'Ingredients',
    perPizza: 'per pizza',
    addToParty: 'Add to my party',
    copy: 'Copy to my pizzas',
    copied: 'Copied to My pizzas in Party Mode.',
    copyName: (n: string) => `${n} (copy)`,
    copyFailed: "Couldn't copy the pizza. Try again.",
    yourRating: 'Your rating',
    rate: 'Rate',
    removeRating: 'Remove rating',
    signInToRate: 'Sign in to rate',
    ownPizza: 'This is your pizza — others can rate it.',
    rateFailed: "Couldn't save your rating. Try again.",
    ratings: (n: number) => `${n} ${n === 1 ? 'rating' : 'ratings'}`,
    noRatings: 'No ratings yet — be the first!',
    report: 'Report',
    reportTitle: 'Report this pizza',
    reportHint: "What's wrong? (e.g. offensive photo, spam, not a pizza)",
    send: 'Send',
    cancel: 'Cancel',
    reported: 'Thanks — a moderator will take a look.',
    alreadyReported: "You've already reported this pizza.",
    reportFailed: "Couldn't send the report. Try again.",
    hide: 'Hide (admin)',
    hidden: 'Hidden from the community.',
    by: 'by',
    anonymous: 'Pizzaiolo',
  },
} as const;

const formatAmount = (n: number) => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

const PizzaPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const lang = useLang();
  const t = T[lang];
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const { savePizza } = usePizzaStore();

  const [pizza, setPizza] = useState<CommunityPizza | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [myRating, setMyRatingState] = useState<number | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    try {
      const found = await fetchCommunityPizza(id);
      setPizza(found);
      setStatus(found ? 'ready' : 'missing');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!supabase) {
      setStatus('missing');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!userId || !pizza || pizza.authorId === userId) return;
    fetchMyRating(pizza.id, userId).then(setMyRatingState).catch(console.error);
  }, [userId, pizza]);

  useEffect(() => {
    if (userId) fetchIsAdmin().then(setIsAdmin);
  }, [userId]);

  const rate = async (score: number | null) => {
    if (!pizza || !userId) return;
    setRatingBusy(true);
    setMessage(null);
    try {
      await setMyRating(pizza.id, userId, score);
      setMyRatingState(score);
      await load(); // refresh the average
    } catch (err) {
      console.error(err);
      setMessage(t.rateFailed);
    } finally {
      setRatingBusy(false);
    }
  };

  const copyToMine = async () => {
    if (!pizza) return;
    const copy: PartyPizza = {
      id: newPizzaId(),
      name: t.copyName(pizza.name),
      description: pizza.description,
      ingredients: pizza.ingredients,
    };
    const ok = await savePizza(copy);
    setMessage(ok ? t.copied : t.copyFailed);
  };

  const sendReport = async () => {
    if (!pizza || !reason.trim()) return;
    try {
      const fresh = await reportPizza(pizza.id, reason);
      setMessage(fresh ? t.reported : t.alreadyReported);
      setReportOpen(false);
      setReason('');
    } catch (err) {
      console.error(err);
      setMessage(t.reportFailed);
    }
  };

  const hide = async () => {
    if (!pizza) return;
    try {
      await setHidden(pizza.id, true);
      setMessage(t.hidden);
      setStatus('missing');
    } catch (err) {
      console.error(err);
    }
  };

  const back = (
    <Link to="/community" className={`${quietLink} inline-flex items-center gap-1.5`}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t.back}
    </Link>
  );

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ink-muted dark:text-char-400" aria-label="Loading" />
      </div>
    );
  }

  if (status !== 'ready' || !pizza) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {back}
        <p className="mt-10 text-center font-display text-lg italic text-ink-muted dark:text-char-400">
          {message ?? (status === 'error' ? t.error : t.notFound)}
        </p>
      </div>
    );
  }

  const own = pizza.authorId === userId;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {back}
      <article className={`${cardClass} mt-4 overflow-hidden`}>
        <img
          src={photoUrl(pizza.imagePath)}
          alt={pizza.name}
          className="aspect-[3/2] w-full border-b border-paper-300 object-cover dark:border-char-600"
        />
        <div className="space-y-6 p-5 sm:p-8">
          <header className="space-y-3">
            <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl dark:text-char-100">{pizza.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex items-center gap-2">
                <Avatar url={pizza.authorAvatar} name={pizza.authorName} size="h-7 w-7" />
                <span className="text-sm text-ink-soft dark:text-char-300">
                  {t.by} {pizza.authorName ?? t.anonymous}
                </span>
              </span>
              {pizza.ratingCount > 0 ? (
                <span className="flex items-center gap-2">
                  <RatingStars value={pizza.avgScore} />
                  <span className="font-mono text-xs tabular-nums text-ink-muted dark:text-char-400">
                    {pizza.avgScore.toFixed(1)} · {t.ratings(pizza.ratingCount)}
                  </span>
                </span>
              ) : (
                <span className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.noRatings}</span>
              )}
            </div>
            {pizza.description[lang] && (
              <p className="font-display text-lg italic text-ink-soft dark:text-char-300">{pizza.description[lang]}</p>
            )}
          </header>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                addToParty(pizza);
                navigate('/party-mode');
              }}
              className={pillSolid}
            >
              <PartyPopper className="h-4 w-4" aria-hidden="true" />
              {t.addToParty}
            </button>
            {!own && (
              <button type="button" onClick={copyToMine} className={pillOutline}>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {t.copy}
              </button>
            )}
          </div>

          {message && (
            <p role="status" className="font-display text-sm italic text-brand-700 dark:text-brand-300">
              {message}
            </p>
          )}

          {/* Your rating */}
          <section className="rounded-md border border-dashed border-paper-400 px-4 py-4 dark:border-char-500">
            <h2 className={`mb-2 ${labelText}`}>{t.yourRating}</h2>
            {!auth.enabled ? null : !userId ? (
              <button type="button" onClick={() => auth.signInWithGoogle()} className={pillOutline}>
                {t.signInToRate}
              </button>
            ) : own ? (
              <p className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.ownPizza}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <RatingStars value={myRating ?? 0} onRate={(n) => rate(n)} size="lg" disabled={ratingBusy} rateLabel={t.rate} />
                {myRating !== null && (
                  <button type="button" onClick={() => rate(null)} disabled={ratingBusy} className={quietLink}>
                    {t.removeRating}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Ingredients */}
          <section>
            <h2 className="mb-2 flex items-baseline justify-between">
              <span className={labelText}>{t.ingredients}</span>
              <span className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.perPizza}</span>
            </h2>
            <ul className="divide-y divide-dashed divide-paper-400 dark:divide-char-500">
              {pizza.ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="text-ink dark:text-char-100">{ing.name[lang]}</span>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-brand-700 dark:text-brand-300">
                    {formatAmount(ing.amount)} {ing.unit[lang]}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Report / moderate */}
          {userId && !own && (
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-paper-400 pt-4 dark:border-char-500">
              {reportOpen ? (
                <div className="w-full space-y-2">
                  <label htmlFor="report-reason" className={`block ${labelText}`}>
                    {t.reportTitle}
                  </label>
                  <textarea
                    id="report-reason"
                    rows={2}
                    maxLength={500}
                    value={reason}
                    placeholder={t.reportHint}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full resize-none rounded-md border border-paper-400 bg-white/60 px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60 dark:text-char-100"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={sendReport} disabled={!reason.trim()} className={pillSolid}>
                      {t.send}
                    </button>
                    <button type="button" onClick={() => setReportOpen(false)} className={pillOutline}>
                      {t.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setReportOpen(true)} className={`${quietLink} inline-flex items-center gap-1.5`}>
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.report}
                </button>
              )}
              {isAdmin && !reportOpen && (
                <button type="button" onClick={hide} className={`${quietLink} inline-flex items-center gap-1.5`}>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.hide}
                </button>
              )}
            </footer>
          )}
        </div>
      </article>
    </div>
  );
};

export default PizzaPage;
