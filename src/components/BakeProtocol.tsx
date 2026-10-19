import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, FilePlus2, Loader2, Printer, RefreshCw, Save, Trash2 } from 'lucide-react';
import type { PizzaState, RecipeResult } from '../types/pizza';
import {
  AUTO_FIELDS,
  AutoField,
  calculatorValues,
  deleteLog,
  Draft,
  emptyProtocol,
  GAS_JAR,
  LIFT,
  listLogs,
  loadDraft,
  OPENING,
  OUTCOME,
  Protocol,
  recipeSnapshot,
  RHEOLOGY,
  saveDraft,
  SavedLog,
  saveLog,
  SPREAD,
} from '../lib/doughLog';
import { PROTOCOL_TEXT } from '../lib/doughLogText';
import { useLang } from '../hooks/useLang';
import { useAuth } from '../contexts/AuthContext';
import ProtocolSheet from './ProtocolSheet';

/* ------------------------------------------------------------------ */
/* Small building blocks (same paper-and-ink look as CalculatorControls) */
/* ------------------------------------------------------------------ */

const labelText = 'block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft dark:text-char-400';
const inputClass =
  'w-full min-w-0 rounded-md border border-paper-400 bg-white/60 px-2.5 py-2 font-mono text-sm tabular-nums text-ink outline-none placeholder:text-ink-muted/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60 dark:text-char-100 dark:placeholder:text-char-400/60 dark:[color-scheme:dark]';
const pill =
  'inline-flex items-center gap-1.5 rounded-full border border-paper-400 px-3 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-soft transition-all hover:border-brand-400 hover:text-brand-700 active:scale-[0.97] disabled:opacity-50 dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300';
const pillSolid =
  'inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-50 transition-colors hover:bg-brand-700 active:scale-[0.97] disabled:opacity-50 dark:bg-char-100 dark:text-char-900 dark:hover:bg-brand-300';

const chipClass = (on: boolean) =>
  [
    'rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-all active:scale-[0.97]',
    on
      ? 'border-ink bg-ink text-paper-50 dark:border-char-100 dark:bg-char-100 dark:text-char-900'
      : 'border-paper-400 bg-white/50 text-ink-soft hover:border-brand-400 hover:text-brand-700 dark:border-char-500 dark:bg-transparent dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300',
  ].join(' ');

function Part({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
      <h3 className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink dark:text-char-100">
          <span className="text-brand-600 dark:text-brand-300">{n}</span> · {title}
        </span>
        {hint && <span className="font-display text-sm italic text-ink-muted dark:text-char-400">{hint}</span>}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  unit,
  children,
}: {
  label: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={`mb-1.5 ${labelText}`}>{label}</span>
      <span className="flex items-center gap-1.5">
        {children}
        {unit && <span className="shrink-0 font-mono text-xs text-ink-muted dark:text-char-400">{unit}</span>}
      </span>
    </label>
  );
}

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
  const { enabled: authEnabled, user, signInWithGoogle } = useAuth();
  const calc = useMemo(() => calculatorValues(state, recipe), [state, recipe]);

  const [draft, setDraft] = useState<Draft>(
    () => loadDraft() ?? { id: null, data: { ...emptyProtocol(), ...calc }, touched: [] },
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
      return { ...d, data: { ...d.data, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } };
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
    setDraft({ id: null, data: { ...emptyProtocol(), ...calc }, touched: [] });
  };

  const openLog = (log: SavedLog) => {
    setSavedRecipe(log.recipe);
    setStatus(null);
    setDraft({ id: log.id, data: log.protocol, touched: [...AUTO_FIELDS] });
    document.getElementById('bake-protocol')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const removeLog = async (log: SavedLog) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await deleteLog(log.id);
      setLogs((prev) => prev?.filter((l) => l.id !== log.id) ?? null);
      if (draft.id === log.id) setDraft((d) => ({ ...d, id: null }));
    } catch (err) {
      console.error(err);
    }
  };

  const snapshot = savedRecipe ?? recipeSnapshot(state, recipe);
  const summary = (() => {
    const s = snapshot as ReturnType<typeof recipeSnapshot>;
    const ferment = s.isColdFerment
      ? `${s.coldFermentHours} h ${lang === 'sv' ? 'kallt' : 'cold'} ${s.fridgeTemp} °C`
      : `${s.roomTemp} °C`;
    return `${s.numPizzas} × ${s.doughBallWeight} g · ${s.waterPercent} % · ${ferment}`;
  })();

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

  const print = () => {
    const root = document.documentElement;
    root.dataset.print = 'protocol';
    const done = () => {
      delete root.dataset.print;
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    window.setTimeout(done, 1000); // browsers without afterprint
  };

  const dateLabel = (iso: string | null) =>
    iso ? new Date(`${iso}T12:00`).toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const editingLog = draft.id ? logs?.find((l) => l.id === draft.id) : undefined;
  const optionLabel = (k: string) => t.options[k] ?? k;
  const target = (v: number) => (Number.isFinite(v) && v > 0 ? `${t.target} ${v.toFixed(1)}` : '');

  return (
    <section
      id="bake-protocol"
      className="mt-12 rounded-lg border border-paper-300 bg-paper-50 shadow-[0_1px_0_rgba(60,40,20,0.04),0_10px_24px_-14px_rgba(60,40,20,0.22)] dark:border-char-600 dark:bg-char-800 dark:shadow-none"
    >
      <div className="flex items-center justify-between border-b border-dashed border-paper-400 px-5 pb-4 pt-5 sm:px-6 dark:border-char-500">
        <div className="flex flex-1 items-baseline gap-3">
          <span className="font-mono text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">04</span>
          <h2 className="font-display text-xl font-bold text-ink dark:text-char-100">{t.sectionTitle}</h2>
          <span className="hidden font-display text-sm italic text-ink-muted sm:inline dark:text-char-400">{t.title}</span>
        </div>
        <ClipboardList className="h-4 w-4 text-ink-muted dark:text-char-400" aria-hidden="true" />
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <p className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.intro}</p>
        {editingLog && (
          <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-brand-700 dark:text-brand-300">
            {t.editing(dateLabel(editingLog.bakedOn))}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <Field label={t.date}>
            <input type="date" value={p.date} onChange={(e) => set('date', e.target.value)} className={inputClass} />
          </Field>
          <Field label={t.batch}>
            <input value={p.batch} maxLength={40} onChange={(e) => set('batch', e.target.value)} className={inputClass} />
          </Field>
        </div>

        {/* 1 · Recipe */}
        <Part n={1} title={t.s1}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid grid-cols-[1fr_6.5rem] gap-3">
              <Field label={t.flour1}>
                <input value={p.flour1} maxLength={60} onChange={(e) => set('flour1', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t.batchNo}>
                <input value={p.flour1Batch} maxLength={30} onChange={(e) => set('flour1Batch', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t.flour2}>
                <input value={p.flour2} maxLength={60} onChange={(e) => set('flour2', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t.batchNo}>
                <input value={p.flour2Batch} maxLength={30} onChange={(e) => set('flour2Batch', e.target.value)} className={inputClass} />
              </Field>
              <div className="col-span-2">
                <Field label={t.blend}>
                  <input value={p.blend} maxLength={80} onChange={(e) => set('blend', e.target.value)} className={inputClass} />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-[4.5rem_1fr_5rem] items-center gap-x-2 gap-y-2">
              <span />
              <span className={labelText}>{t.weight}</span>
              <span className={labelText}>{t.pct}</span>
              {(
                [
                  ['flour', 'flourG', null],
                  ['water', 'waterG', 'waterPct'],
                  ['salt', 'saltG', 'saltPct'],
                  ['yeast', 'yeastG', 'yeastPct'],
                ] as const
              ).map(([label, g, pct]) => (
                <React.Fragment key={label}>
                  <span className="text-sm font-medium text-ink dark:text-char-100">{t[label]}</span>
                  <input
                    aria-label={`${t[label]} ${t.weight}`}
                    inputMode="decimal"
                    value={p[g]}
                    onChange={(e) => set(g, e.target.value)}
                    className={inputClass}
                  />
                  {pct ? (
                    <input
                      aria-label={`${t[label]} %`}
                      inputMode="decimal"
                      value={p[pct]}
                      onChange={(e) => set(pct, e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <span className="px-2.5 font-mono text-sm text-ink-muted dark:text-char-400">100</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </Part>

        {/* 2 · Temperature & process */}
        <Part n={2} title={t.s2}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label={t.waterTemp} unit="°C">
              <input inputMode="decimal" value={p.waterTemp} placeholder={target(recipe.requiredWaterTemp)} onChange={(e) => set('waterTemp', e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.doughTemp} unit="°C">
              <input inputMode="decimal" value={p.doughTemp} placeholder={target(state.desiredDoughTemp)} onChange={(e) => set('doughTemp', e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.roomTemp} unit="°C">
              <input inputMode="decimal" value={p.roomTemp} onChange={(e) => set('roomTemp', e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.fermentTemp} unit="°C">
              <input inputMode="decimal" value={p.fermentTemp} onChange={(e) => set('fermentTemp', e.target.value)} className={inputClass} />
            </Field>
            <div>
              <span className={`mb-1.5 ${labelText}`}>{t.autolyse}</span>
              <div className="flex gap-2" role="group" aria-label={t.autolyse}>
                {(['yes', 'no'] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={p.autolyse === v} onClick={() => toggleOne('autolyse', v)} className={`${chipClass(p.autolyse === v)} flex-1 text-center`}>
                    {t[v]}
                  </button>
                ))}
              </div>
            </div>
            <Field label={t.folds} unit={t.foldsUnit}>
              <input inputMode="numeric" value={p.folds} onChange={(e) => set('folds', e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.fermentStart}>
              <input type="time" value={p.fermentStart} onChange={(e) => set('fermentStart', e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.totalHours} unit="h">
              <input inputMode="decimal" value={p.totalHours} onChange={(e) => set('totalHours', e.target.value)} className={inputClass} />
            </Field>
          </div>
        </Part>

        {/* 3 · The two clocks */}
        <Part n={3} title={t.s3}>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                { title: t.clock1, key: 'gasJar', values: GAS_JAR, unit: '', text: 'jarLevel', textLabel: t.jarLevel },
                { title: t.clock2, key: 'spread', values: SPREAD, unit: 'cm', text: 'maturity', textLabel: t.maturity },
              ] as const
            ).map((c) => (
              <div key={c.key} className="rounded-md border border-paper-400 p-3 dark:border-char-500">
                <p className={`mb-2 ${labelText}`}>{c.title}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={c.title}>
                  {c.values.map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={p[c.key] === v}
                      onClick={() => toggleOne(c.key, v)}
                      className={`${chipClass(p[c.key] === v)} min-w-[2.75rem] rounded-full text-center font-mono tabular-nums`}
                    >
                      {v}
                    </button>
                  ))}
                  {c.unit && <span className="self-center font-mono text-xs text-ink-muted dark:text-char-400">{c.unit}</span>}
                </div>
                <div className="mt-3">
                  <Field label={c.textLabel}>
                    <input value={p[c.text]} maxLength={60} onChange={(e) => set(c.text, e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Part>

        {/* 4 · Handling */}
        <Part n={4} title={t.s4} hint={t.s4hint}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className={`mb-2 ${labelText}`}>{t.rheologyTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {RHEOLOGY.map((k) => (
                  <button key={k} type="button" aria-pressed={p.rheology.includes(k)} onClick={() => toggleIn('rheology', k)} className={chipClass(p.rheology.includes(k))}>
                    {optionLabel(k)}
                  </button>
                ))}
                <button type="button" aria-pressed={p.jarPhoto} onClick={() => set('jarPhoto', !p.jarPhoto)} className={chipClass(p.jarPhoto)}>
                  {t.jarPhoto}
                </button>
              </div>
            </div>
            <div>
              <p className={`mb-2 ${labelText}`}>{t.openingTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {OPENING.map((k) => (
                  <button key={k} type="button" aria-pressed={p.opening.includes(k)} onClick={() => toggleIn('opening', k)} className={chipClass(p.opening.includes(k))}>
                    {optionLabel(k)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Part>

        {/* 5 · Result */}
        <Part n={5} title={t.s5}>
          <div className="space-y-3">
            {(
              [
                ['lift', t.lift, LIFT],
                ['outcome', t.outcome, OUTCOME],
              ] as const
            ).map(([key, label, values]) => (
              <div key={key}>
                <p className={`mb-2 ${labelText}`}>{label}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
                  {values.map((k) => (
                    <button key={k} type="button" aria-pressed={p[key] === k} onClick={() => toggleOne(key, k)} className={chipClass(p[key] === k)}>
                      {optionLabel(k)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Part>

        {/* 6 · Notes */}
        <Part n={6} title={t.s6}>
          <textarea
            value={p.notes}
            rows={4}
            maxLength={2000}
            onChange={(e) => set('notes', e.target.value)}
            className={`${inputClass} resize-y font-sans leading-6`}
          />
        </Part>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
          <button type="button" onClick={print} className={pillSolid}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t.print}
          </button>
          {authEnabled &&
            (user ? (
              <button type="button" onClick={save} disabled={busy} className={pill}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
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

        {/* Saved logs */}
        {user && logs && (
          <div className="border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
            <h3 className={`mb-3 ${labelText}`}>{t.myLogs}</h3>
            {logs.length === 0 ? (
              <p className="font-display text-sm italic text-ink-muted dark:text-char-400">{t.noLogs}</p>
            ) : (
              <ul className="divide-y divide-dashed divide-paper-400 dark:divide-char-500">
                {logs.map((log) => (
                  <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink dark:text-char-100">
                        <span className="font-mono tabular-nums text-ink-muted dark:text-char-400">{dateLabel(log.bakedOn)}</span>
                        {' · '}
                        {log.title || t.untitled}
                      </p>
                      {log.protocol.outcome && (
                        <p className="font-display text-xs italic text-ink-muted dark:text-char-400">{optionLabel(log.protocol.outcome)}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => openLog(log)} className={pill}>
                        {t.open}
                      </button>
                      <button
                        type="button"
                        aria-label={`${t.delete}: ${log.title ?? ''}`}
                        onClick={() => removeLog(log)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-paper-100 hover:text-brand-700 dark:text-char-400 dark:hover:bg-char-700 dark:hover:text-brand-300"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <ProtocolSheet p={p} t={t} summary={summary} />
    </section>
  );
};

export default BakeProtocol;
