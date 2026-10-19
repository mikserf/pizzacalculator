import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ClipboardList,
  FilePlus2,
  FlaskConical,
  Loader2,
  LogIn,
  Printer,
  RefreshCw,
  Save,
} from 'lucide-react';
import type { PizzaState, RecipeResult } from '../types/pizza';
import {
  AUTO_FIELDS,
  AutoField,
  calculatorValues,
  Draft,
  emptyProtocol,
  formatLogDate,
  hasUserInput,
  printProtocol,
  recipeSummary,
  nextBatch,
  listLogs,
  loadDraft,
  Protocol,
  recipeSnapshot,
  saveDraft,
  SavedLog,
  saveLog,
} from '../lib/doughLog';
import { PROTOCOL_TEXT } from '../lib/doughLogText';
import { useLang } from '../hooks/useLang';
import { useAuth } from '../contexts/AuthContext';
import ProtocolSheet from './ProtocolSheet';
import ProtocolForm from './ProtocolForm';
import { pill, pillSolid } from '../lib/protocolStyles';

/* ------------------------------------------------------------------ */
/* Section 04                                                          */
/* ------------------------------------------------------------------ */

interface BakeProtocolProps {
  state: PizzaState;
  recipe: RecipeResult;
}

const BakeProtocol = ({ state, recipe }: BakeProtocolProps) => {
  const lang = useLang();
  const t = PROTOCOL_TEXT[lang];
  const { enabled: authEnabled, loading: authLoading, user, signInWithGoogle } = useAuth();
  /** Collapsed by default (opened directly by links to #bake-protocol); a signed-in feature. */
  const [open, setOpen] = useState(() => window.location.hash === '#bake-protocol');
  const calc = useMemo(() => calculatorValues(state, recipe), [state, recipe]);

  const [draft, setDraft] = useState<Draft>(
    () => loadDraft() ?? { id: null, data: { ...emptyProtocol(), ...calc }, touched: [], batchAuto: true },
  );
  /** Recipe snapshot of a loaded saved log (kept when it's updated). */
  const [savedRecipe, setSavedRecipe] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<SavedLog[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const p = draft.data;

  // New protocols follow the calculator for every auto field the user hasn't edited.
  useEffect(() => {
    setDraft((d) => {
      if (d.id) return d;
      let changed = false;
      const data = { ...d.data };
      for (const k of AUTO_FIELDS) {
        if (!d.touched.includes(k) && data[k] !== calc[k]) {
          data[k] = calc[k];
          changed = true;
        }
      }
      return changed ? { ...d, data } : d;
    });
  }, [calc]);

  useEffect(() => saveDraft(draft), [draft]);

  // Arriving via /#bake-protocol (e.g. "New log" in Deglabbet): bring the section into view.
  useEffect(() => {
    if (open && user && window.location.hash === '#bake-protocol') {
      document.getElementById('bake-protocol')?.scrollIntoView({ block: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Batch number YYMM-NN for new protocols, from the protocol date and your saved logs.
  const autoBatch = logs
    ? nextBatch(
        p.date,
        logs.map((l) => l.protocol.batch),
      )
    : null;
  useEffect(() => {
    if (!autoBatch) return;
    setDraft((d) =>
      d.id || !d.batchAuto || d.data.batch === autoBatch ? d : { ...d, data: { ...d.data, batch: autoBatch } },
    );
  }, [autoBatch]);

  useEffect(() => {
    if (!user) {
      setLogs(null);
      return;
    }
    listLogs()
      .then(setLogs)
      .catch((err) => {
        console.error('Error loading dough logs:', err);
        setLogs([]);
        setStatus(t.loadError);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const set = <K extends keyof Protocol>(key: K, value: Protocol[K]) => {
    setStatus(null);
    setDraft((d) => ({
      ...d,
      data: { ...d.data, [key]: value },
      // Typing a batch number turns the automatic one off; clearing it turns it back on.
      batchAuto: key === 'batch' ? value === '' : d.batchAuto,
      touched:
        (AUTO_FIELDS as readonly string[]).includes(key) && !d.touched.includes(key as AutoField)
          ? [...d.touched, key as AutoField]
          : d.touched,
    }));
  };
  // Toggles read the latest state (not this render's), so quick taps never overwrite each other.
  const toggleIn = (key: 'rheology' | 'opening', value: string) => {
    setStatus(null);
    setDraft((d) => {
      const list = d.data[key];
      return {
        ...d,
        data: { ...d.data, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] },
      };
    });
  };
  const toggleOne = (key: 'gasJar' | 'spread' | 'lift' | 'outcome' | 'autolyse', value: string) => {
    setStatus(null);
    setDraft((d) => ({ ...d, data: { ...d.data, [key]: d.data[key] === value ? '' : value } }));
  };

  const syncFromCalculator = () => {
    setSavedRecipe(null);
    setDraft((d) => ({ ...d, data: { ...d.data, ...calc }, touched: [] }));
  };

  const startNew = () => {
    if (!window.confirm(t.confirmNew)) return;
    setSavedRecipe(null);
    setStatus(null);
    setDraft({ id: null, data: { ...emptyProtocol(), ...calc }, touched: [], batchAuto: true });
  };

  const inProgress = !!draft.id || (!draft.batchAuto && p.batch !== '') || hasUserInput(p);

  const snapshot = savedRecipe ?? recipeSnapshot(state, recipe);
  const summary = recipeSummary(snapshot, lang);

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const title = p.batch.trim() || `${t.pizzas(state.numPizzas)} · ${state.doughBallWeight} g`;
      const saved = await saveLog(draft.id, p, snapshot, title);
      setSavedRecipe(saved.recipe);
      setDraft((d) => ({ ...d, id: saved.id }));
      setLogs((prev) => [saved, ...(prev ?? []).filter((l) => l.id !== saved.id)]);
      setStatus(t.saved);
    } catch (err) {
      console.error('Error saving dough log:', err);
      setStatus(t.saveError);
    } finally {
      setBusy(false);
    }
  };

  const print = printProtocol;
  const dateLabel = (iso: string | null) => formatLogDate(iso, lang);
  const editingLog = draft.id ? logs?.find((l) => l.id === draft.id) : undefined;

  return (
    <section
      id="bake-protocol"
      className="mt-12 rounded-lg border border-paper-300 bg-paper-50 shadow-[0_1px_0_rgba(60,40,20,0.04),0_10px_24px_-14px_rgba(60,40,20,0.22)] dark:border-char-600 dark:bg-char-800 dark:shadow-none"
    >
      {user ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls="bake-protocol-body"
          aria-label={open ? t.hide : t.show}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center gap-3 px-5 pb-4 pt-5 text-left sm:px-6 ${
            open ? 'border-b border-dashed border-paper-400 dark:border-char-500' : ''
          }`}
        >
          <span className="flex flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">04</span>
            <span className="font-display text-xl font-bold text-ink dark:text-char-100">{t.sectionTitle}</span>
            <span className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.title}</span>
            {!open && inProgress && (
              <span className="rounded-full border border-brand-400 px-2 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-brand-700 dark:border-brand-400/60 dark:text-brand-300">
                {t.inProgress}
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-ink-muted transition-transform dark:text-char-400 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="px-5 pb-5 pt-5 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">04</span>
            <h2 className="font-display text-xl font-bold text-ink dark:text-char-100">{t.sectionTitle}</h2>
            <span className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.title}</span>
            <ClipboardList
              className="ml-auto h-4 w-4 self-center text-ink-muted dark:text-char-400"
              aria-hidden="true"
            />
          </div>
          {authEnabled && !authLoading && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-paper-400 px-4 py-3 dark:border-char-500">
              <p className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.lockedHint}</p>
              <button type="button" onClick={() => signInWithGoogle()} className={pill}>
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                {t.signIn}
              </button>
            </div>
          )}
        </div>
      )}

      {user && open && (
        <div id="bake-protocol-body" className="space-y-5 p-5 sm:p-6">
          <p className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.intro}</p>
          {editingLog && (
            <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-brand-700 dark:text-brand-300">
              {t.editing(dateLabel(editingLog.bakedOn))}
            </p>
          )}

          <ProtocolForm
            p={p}
            t={t}
            set={set}
            toggleIn={toggleIn}
            toggleOne={toggleOne}
            targets={{ waterTemp: recipe.requiredWaterTemp, doughTemp: state.desiredDoughTemp }}
          />

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
            <button type="button" onClick={print} className={pillSolid}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t.print}
            </button>
            {authEnabled &&
              (user ? (
                <button type="button" onClick={save} disabled={busy} className={pill}>
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {busy ? t.saving : draft.id ? t.update : t.save}
                </button>
              ) : (
                <button type="button" onClick={() => signInWithGoogle()} className={pill}>
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.signInToSave}
                </button>
              ))}
            <button type="button" onClick={syncFromCalculator} className={pill}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.syncCalc}
            </button>
            <button type="button" onClick={startNew} className={pill}>
              <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t.newProtocol}
            </button>
          </div>
          <p role="status" className="-mt-2 font-display text-sm italic text-ink-muted dark:text-char-400">
            {status ?? t.draftNote}
          </p>

          {/* Saved logs live in Deglabbet */}
          {logs && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
              <p className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.labHint(logs.length)}</p>
              <Link to="/deglabbet" className={pill}>
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                {t.toLab}
              </Link>
            </div>
          )}
        </div>
      )}

      {user && <ProtocolSheet p={p} t={t} summary={summary} />}
    </section>
  );
};

export default BakeProtocol;
