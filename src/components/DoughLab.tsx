import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calculator, FlaskConical, Loader2, LogIn, Plus, Printer, Save, Search, Trash2 } from 'lucide-react';
import {
  deleteLog,
  formatLogDate,
  listLogs,
  printProtocol,
  Protocol,
  recipeSummary,
  SavedLog,
  saveLog,
} from '../lib/doughLog';
import { DOUGH_LAB_TEXT, PROTOCOL_TEXT } from '../lib/doughLogText';
import { linkFromRecipe } from '../lib/recipeLink';
import { inputClass, labelText, pill, pillSolid } from '../lib/protocolStyles';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../hooks/useLang';
import ProtocolForm, { ToggleManyKey, ToggleOneKey } from './ProtocolForm';
import ProtocolSheet from './ProtocolSheet';

const cardClass =
  'rounded-lg border border-paper-300 bg-paper-50 shadow-[0_1px_0_rgba(60,40,20,0.04),0_10px_24px_-14px_rgba(60,40,20,0.22)] dark:border-char-600 dark:bg-char-800 dark:shadow-none';
const badge =
  'rounded-full border border-paper-400 px-2 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-ink-soft dark:border-char-500 dark:text-char-300';

/** UTC timestamp → local "YYYY-MM-DD" (just after midnight the UTC date is still yesterday). */
const localDate = (ts: string) => {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Deglabbet: members' page for saved dough logs — list at /deglabbet, one log at /deglabbet/:id. */
const DoughLab = () => {
  const { id } = useParams();
  const lang = useLang();
  const t = DOUGH_LAB_TEXT[lang];
  const pt = PROTOCOL_TEXT[lang];
  const { enabled, loading: authLoading, user, signInWithGoogle } = useAuth();
  const [logs, setLogs] = useState<SavedLog[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) {
      setLogs(null);
      return;
    }
    setError(false);
    listLogs()
      .then(setLogs)
      .catch((err) => {
        console.error('Error loading dough logs:', err);
        setError(true);
      });
  }, [user]);

  const header = (
    <div className="mb-8 text-center">
      <p className="mb-3 inline-flex items-center gap-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-brand-600 dark:text-brand-300">
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
        {pt.title}
      </p>
      <h1 className="mb-2 font-display text-4xl font-bold text-ink sm:text-5xl dark:text-char-100">{t.title}</h1>
      <p className="font-display text-lg italic text-ink-muted dark:text-char-400">{t.subtitle}</p>
    </div>
  );

  if (authLoading || (user && !logs && !error)) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ink-muted dark:text-char-400" aria-label="Loading" />
      </div>
    );
  }

  if (!enabled || !user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        {header}
        <div className={`${cardClass} flex flex-col items-center gap-4 p-6 text-center`}>
          <p className="font-display text-base italic text-ink-muted dark:text-char-400">{t.signedOut}</p>
          {enabled && (
            <button type="button" onClick={() => signInWithGoogle()} className={pillSolid}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t.signIn}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (error || !logs) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center font-display italic text-brand-700 dark:text-brand-300">
        {t.loadError}
      </div>
    );
  }

  if (id) {
    const log = logs.find((l) => l.id === id);
    return (
      <LogDetail
        key={id}
        log={log}
        onSaved={(saved) => setLogs((prev) => (prev ?? []).map((l) => (l.id === saved.id ? saved : l)))}
        onDeleted={(deletedId) => setLogs((prev) => (prev ?? []).filter((l) => l.id !== deletedId))}
      />
    );
  }

  return <LogList logs={logs} header={header} />;
};

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

function LogList({ logs, header }: { logs: SavedLog[]; header: React.ReactNode }) {
  const lang = useLang();
  const t = DOUGH_LAB_TEXT[lang];
  const pt = PROTOCOL_TEXT[lang];
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.protocol.batch, l.title ?? '', l.protocol.flour1, l.protocol.flour2, l.protocol.blend, l.protocol.notes]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [logs, query]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {header}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t.search}</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-char-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            placeholder={t.search}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-9 font-sans`}
          />
        </label>
        <Link to="/#bake-protocol" className={pillSolid}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.newLog}
        </Link>
      </div>

      <p className={`mb-3 ${labelText}`}>{t.count(filtered.length)}</p>

      {logs.length === 0 ? (
        <p className="rounded-md border border-dashed border-paper-400 px-6 py-10 text-center font-display italic text-ink-muted dark:border-char-500 dark:text-char-400">
          {t.empty}
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center font-display italic text-ink-muted dark:text-char-400">{t.noMatch}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((log) => {
            const p = log.protocol;
            const summary = recipeSummary(log.recipe, lang);
            return (
              <li key={log.id}>
                <Link
                  to={`/deglabbet/${log.id}`}
                  className={`${cardClass} group flex h-full flex-col gap-2 p-4 transition-transform hover:-translate-y-0.5`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-lg font-semibold tabular-nums text-ink transition-colors group-hover:text-brand-700 dark:text-char-100 dark:group-hover:text-brand-300">
                      {p.batch || t.noBatch}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-ink-muted dark:text-char-400">
                      {formatLogDate(log.bakedOn, lang)}
                    </span>
                  </div>
                  {summary && <p className="font-mono text-xs text-ink-soft dark:text-char-300">{summary}</p>}
                  {(p.flour1 || p.flour2) && (
                    <p className="truncate text-sm text-ink-soft dark:text-char-300">
                      {[p.flour1, p.flour2].filter(Boolean).join(' + ')}
                    </p>
                  )}
                  {(p.lift || p.outcome) && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.lift && <span className={badge}>{pt.options[p.lift]}</span>}
                      {p.outcome && <span className={badge}>{pt.options[p.outcome]}</span>}
                    </div>
                  )}
                  {p.notes && (
                    <p className="line-clamp-2 font-display text-sm italic text-ink-muted dark:text-char-400">
                      {p.notes}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One log: view + edit                                                */
/* ------------------------------------------------------------------ */

function LogDetail({
  log,
  onSaved,
  onDeleted,
}: {
  log: SavedLog | undefined;
  onSaved: (log: SavedLog) => void;
  onDeleted: (id: string) => void;
}) {
  const lang = useLang();
  const t = DOUGH_LAB_TEXT[lang];
  const pt = PROTOCOL_TEXT[lang];
  const navigate = useNavigate();
  const [data, setData] = useState<Protocol | null>(log?.protocol ?? null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const dirty = !!log && !!data && JSON.stringify(data) !== JSON.stringify(log.protocol);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const back = (
    <Link
      to="/deglabbet"
      onClick={(e) => {
        if (dirty && !window.confirm(t.confirmLeave)) e.preventDefault();
      }}
      className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-brand-700 dark:text-char-400 dark:hover:text-brand-300"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t.back}
    </Link>
  );

  if (!log || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {back}
        <p className="mt-10 text-center font-display text-lg italic text-ink-muted dark:text-char-400">{t.notFound}</p>
      </div>
    );
  }

  const set = <K extends keyof Protocol>(key: K, value: Protocol[K]) => {
    setStatus(null);
    setData((d) => (d ? { ...d, [key]: value } : d));
  };
  const toggleIn = (key: ToggleManyKey, value: string) => {
    setStatus(null);
    setData((d) =>
      d ? { ...d, [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value] } : d,
    );
  };
  const toggleOne = (key: ToggleOneKey, value: string) => {
    setStatus(null);
    setData((d) => (d ? { ...d, [key]: d[key] === value ? '' : value } : d));
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const saved = await saveLog(log.id, data, log.recipe, data.batch.trim() || log.title || '');
      onSaved(saved);
      setData(saved.protocol);
      setStatus(t.saved);
    } catch (err) {
      console.error('Error saving dough log:', err);
      setStatus(t.saveError);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await deleteLog(log.id);
      onDeleted(log.id);
      navigate('/deglabbet');
    } catch (err) {
      console.error('Error deleting dough log:', err);
      setStatus(t.saveError);
    }
  };

  const summary = recipeSummary(log.recipe, lang);
  const r = log.recipe as { requiredWaterTemp?: number };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {back}

      <article className={`${cardClass} mt-4`}>
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-dashed border-paper-400 px-5 pb-4 pt-5 sm:px-6 dark:border-char-500">
          <div>
            <p className={labelText}>{pt.title}</p>
            <h1 className="font-mono text-2xl font-semibold tabular-nums text-ink sm:text-3xl dark:text-char-100">
              {data.batch || t.noBatch}
            </h1>
            <p className="mt-1 font-mono text-xs text-ink-muted dark:text-char-400">
              {formatLogDate(data.date, lang)}
              {summary && ` · ${summary}`}
            </p>
          </div>
          <Link to={linkFromRecipe(log.recipe)} className={pill}>
            <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
            {t.openRecipe}
          </Link>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <ProtocolForm
            p={data}
            t={pt}
            set={set}
            toggleIn={toggleIn}
            toggleOne={toggleOne}
            targets={{ waterTemp: r.requiredWaterTemp }}
          />

          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
            <button type="button" onClick={save} disabled={busy || !dirty} className={pillSolid}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {busy ? t.saving : t.save}
            </button>
            <button type="button" onClick={printProtocol} className={pill}>
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              {t.print}
            </button>
            <button type="button" onClick={remove} className={`${pill} ml-auto`}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t.delete}
            </button>
          </div>
          <p role="status" className="-mt-2 font-display text-sm italic text-ink-muted dark:text-char-400">
            {status ?? (dirty ? t.unsaved : t.updated(formatLogDate(localDate(log.updatedAt), lang)))}
          </p>
        </div>
      </article>

      <ProtocolSheet p={data} t={pt} summary={summary} />
    </div>
  );
}

export default DoughLab;
