import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame, Loader2, Trophy, Users } from 'lucide-react';
import type { CommunityPizza } from '../types/party';
import { fetchFeed, FeedSort, PAGE_SIZE } from '../lib/community';
import { photoUrl } from '../lib/photos';
import { supabase } from '../lib/supabase';
import { useLang } from '../hooks/useLang';
import { cardClass, pillOutline, segBtn } from '../lib/styles';
import RatingStars from './RatingStars';
import { Avatar } from './AccountMenu';

const T = {
  sv: {
    title: 'Community',
    subtitle: 'Pizzor från andra pizzabagare — betygsätt, kopiera och lägg till i din fest.',
    latest: 'Senaste',
    top: 'Topplista',
    trending: 'Trendar',
    loadMore: 'Visa fler',
    empty: 'Inga delade pizzor här ännu.',
    emptyHint: 'Dela din egen: Party Mode → Mina pizzor → redigera → lägg till foto → Dela med communityn.',
    trendingEmpty: 'Inga betyg den senaste veckan ännu.',
    error: 'Kunde inte ladda communityn. Försök igen om en stund.',
    offline: 'Communityn är inte tillgänglig i den här versionen av sidan.',
    ratings: (n: number) => `${n} ${n === 1 ? 'betyg' : 'betyg'}`,
    noRatings: 'Inga betyg än',
    by: 'av',
    anonymous: 'Pizzabagare',
  },
  en: {
    title: 'Community',
    subtitle: 'Pizzas from other pizzaiolos — rate them, copy them, add them to your party.',
    latest: 'Latest',
    top: 'Top rated',
    trending: 'Trending',
    loadMore: 'Show more',
    empty: 'No shared pizzas here yet.',
    emptyHint: 'Share your own: Party Mode → My pizzas → edit → add a photo → Share with the community.',
    trendingEmpty: 'No ratings in the last week yet.',
    error: "Couldn't load the community. Try again in a moment.",
    offline: "The community isn't available in this version of the site.",
    ratings: (n: number) => `${n} ${n === 1 ? 'rating' : 'ratings'}`,
    noRatings: 'No ratings yet',
    by: 'by',
    anonymous: 'Pizzaiolo',
  },
} as const;

const TABS: { sort: FeedSort; Icon: typeof Clock }[] = [
  { sort: 'latest', Icon: Clock },
  { sort: 'top', Icon: Trophy },
  { sort: 'trending', Icon: Flame },
];

const SORT_KEY = 'communitySort';

export function CommunityCard({ pizza }: { pizza: CommunityPizza }) {
  const lang = useLang();
  const t = T[lang];
  return (
    <Link
      to={`/pizza/${pizza.id}`}
      className={`${cardClass} group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5`}
    >
      <img
        src={photoUrl(pizza.imagePath)}
        alt=""
        loading="lazy"
        className="aspect-[3/2] w-full border-b border-paper-300 object-cover dark:border-char-600"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-700 dark:text-char-100 dark:group-hover:text-brand-300">
          {pizza.name}
        </h2>
        {pizza.description[lang] && (
          <p className="line-clamp-2 font-display text-sm italic text-ink-muted dark:text-char-400">
            {pizza.description[lang]}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-paper-400 pt-3 dark:border-char-500">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar url={pizza.authorAvatar} name={pizza.authorName} size="h-6 w-6" />
            <span className="truncate text-xs text-ink-soft dark:text-char-300">
              {pizza.authorName ?? t.anonymous}
            </span>
          </span>
          {pizza.ratingCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <RatingStars value={pizza.avgScore} />
              <span className="font-mono text-[0.6875rem] tabular-nums text-ink-muted dark:text-char-400">
                {pizza.avgScore.toFixed(1)} · {pizza.ratingCount}
              </span>
            </span>
          ) : (
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-muted dark:text-char-400">
              {t.noRatings}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const Community = () => {
  const lang = useLang();
  const t = T[lang];
  const [sort, setSort] = useState<FeedSort>(() => {
    try {
      const saved = sessionStorage.getItem(SORT_KEY);
      return saved === 'top' || saved === 'trending' ? saved : 'latest';
    } catch {
      return 'latest';
    }
  });
  const [items, setItems] = useState<CommunityPizza[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(SORT_KEY, sort);
    } catch {
      /* ignore */
    }
  }, [sort]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchFeed(sort, page)
      .then((rows) => {
        if (cancelled) return;
        // Trending only lists pizzas that got good ratings in the last 7 days.
        const visible = sort === 'trending' ? rows.filter((r) => r.rankScore > 0) : rows;
        setItems((prev) => (page === 0 ? visible : [...prev, ...visible]));
        setHasMore(rows.length === PAGE_SIZE);
      })
      .catch((err) => {
        console.error('Error loading community:', err);
        if (!cancelled) setError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sort, page]);

  const changeSort = (next: FeedSort) => {
    if (next === sort) return;
    setItems([]);
    setPage(0);
    setSort(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-display text-4xl font-bold text-ink sm:text-5xl dark:text-char-100">{t.title}</h1>
        <p className="mx-auto max-w-xl font-display text-lg italic text-ink-muted dark:text-char-400">{t.subtitle}</p>
        <div className="mt-5 inline-grid grid-cols-3 gap-1 rounded-md border border-paper-400 p-1 dark:border-char-500">
          {TABS.map(({ sort: s, Icon }) => (
            <button key={s} type="button" aria-pressed={sort === s} onClick={() => changeSort(s)} className={segBtn(sort === s)}>
              <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
              {t[s]}
            </button>
          ))}
        </div>
      </div>

      {!supabase ? (
        <p className="text-center font-display italic text-ink-muted dark:text-char-400">{t.offline}</p>
      ) : error ? (
        <p role="alert" className="text-center font-display italic text-brand-700 dark:text-brand-300">
          {t.error}
        </p>
      ) : items.length === 0 && !loading ? (
        <div className="mx-auto max-w-lg rounded-md border border-dashed border-paper-400 px-6 py-12 text-center dark:border-char-500">
          <Users className="mx-auto mb-3 h-10 w-10 text-ink-muted opacity-60 dark:text-char-400" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-ink-soft dark:text-char-300">
            {sort === 'trending' ? t.trendingEmpty : t.empty}
          </p>
          <p className="mt-2 font-display text-sm italic text-ink-muted dark:text-char-400">{t.emptyHint}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <CommunityCard key={p.id} pizza={p} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-ink-muted dark:text-char-400" aria-label="Loading" />
            ) : (
              hasMore && (
                <button type="button" onClick={() => setPage((p) => p + 1)} className={pillOutline}>
                  {t.loadMore}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Community;
