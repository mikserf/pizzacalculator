import { supabase } from './supabase';
import type { PizzaState, RecipeResult } from '../types/pizza';

/* ------------------------------------------------------------------ */
/* Protocol data                                                       */
/* ------------------------------------------------------------------ */

export const RHEOLOGY = ['elastic', 'balanced', 'extensible', 'spreads'] as const;
export const OPENING = [
  'springy',
  'verySoft',
  'easyOpen',
  'brittle',
  'openedFast',
  'heldTopping',
  'lowResistance',
  'tornByTopping',
] as const;
export const LIFT = ['strong', 'good', 'moderate', 'weak', 'none'] as const;
export const OUTCOME = ['perfect', 'slightlyLoose', 'tooLoose', 'tooTight'] as const;
export const GAS_JAR = ['1.9', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '3.0'] as const;
export const SPREAD = ['10', '11', '12', '13', '14', '15', '16', '17', '18'] as const;

/** Every value is kept as a string while editing; empty = not filled in (prints as a blank line). */
export interface Protocol {
  date: string;
  batch: string;
  // 1 · Recipe
  flour1: string;
  flour1Batch: string;
  flour2: string;
  flour2Batch: string;
  blend: string;
  flourG: string;
  waterG: string;
  waterPct: string;
  saltG: string;
  saltPct: string;
  yeastG: string;
  yeastPct: string;
  // 2 · Temperature & process
  waterTemp: string;
  doughTemp: string;
  roomTemp: string;
  fermentTemp: string;
  autolyse: '' | 'yes' | 'no';
  folds: string;
  fermentStart: string;
  totalHours: string;
  // 3 · The two clocks
  gasJar: string;
  jarLevel: string;
  spread: string;
  maturity: string;
  // 4 · Handling
  rheology: string[];
  jarPhoto: boolean;
  opening: string[];
  // 5 · Result
  lift: string;
  outcome: string;
  // 6 · Notes
  notes: string;
}

/** Fields that mirror the calculator until the user edits them. */
export const AUTO_FIELDS = [
  'flourG',
  'waterG',
  'waterPct',
  'saltG',
  'saltPct',
  'yeastG',
  'yeastPct',
  'roomTemp',
  'fermentTemp',
  'totalHours',
] as const;
export type AutoField = (typeof AUTO_FIELDS)[number];

const pad = (n: number) => String(n).padStart(2, '0');
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowHHMM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmt = (v: number, decimals: number) => (Number.isFinite(v) && v > 0 ? v.toFixed(decimals) : '');

export const emptyProtocol = (): Protocol => ({
  date: todayIso(),
  batch: '',
  flour1: '',
  flour1Batch: '',
  flour2: '',
  flour2Batch: '',
  blend: '',
  flourG: '',
  waterG: '',
  waterPct: '',
  saltG: '',
  saltPct: '',
  yeastG: '',
  yeastPct: '',
  waterTemp: '',
  doughTemp: '',
  roomTemp: '',
  fermentTemp: '',
  autolyse: '',
  folds: '',
  fermentStart: nowHHMM(),
  totalHours: '',
  gasJar: '',
  jarLevel: '',
  spread: '',
  maturity: '',
  rheology: [],
  jarPhoto: false,
  opening: [],
  lift: '',
  outcome: '',
  notes: '',
});

/* ------------------------------------------------------------------ */
/* Batch numbers: YYMM-NN ("2610-01" = first batch of October 2026)    */
/* ------------------------------------------------------------------ */

const BATCH_RE = /^(\d{4})-(\d{1,3})$/;

/** "2026-10-19" → "2610". */
export const batchPrefix = (dateIso: string): string => {
  const [y, m] = (dateIso || todayIso()).split('-');
  return `${y.slice(2)}${m}`;
};

/**
 * Next free batch number for the month of `dateIso`: one above the highest
 * existing number that month (not a count, so deleting a log never makes a
 * duplicate). Sorts correctly as text; up to 99 per month keeps two digits.
 */
export function nextBatch(dateIso: string, existing: string[]): string {
  const prefix = batchPrefix(dateIso);
  let max = 0;
  for (const b of existing) {
    const m = BATCH_RE.exec(b.trim());
    if (m && m[1] === prefix) max = Math.max(max, Number(m[2]));
  }
  return `${prefix}-${String(max + 1).padStart(2, '0')}`;
}

/** The calculator's values for the auto fields. */
export function calculatorValues(state: PizzaState, recipe: RecipeResult): Record<AutoField, string> {
  const yeastPct = recipe.flour > 0 ? (recipe.yeast / recipe.flour) * 100 : 0;
  return {
    flourG: fmt(recipe.flour, 0),
    waterG: fmt(recipe.water, 0),
    waterPct: fmt(state.waterPercent, 0),
    saltG: fmt(recipe.salt, 0),
    saltPct: fmt(state.saltPercent, 1),
    yeastG: fmt(recipe.yeast, 2),
    yeastPct: fmt(yeastPct, 2),
    roomTemp: String(state.roomTemp),
    fermentTemp: state.isColdFerment ? String(state.fridgeTemp) : String(state.roomTemp),
    totalHours: fmt(recipe.fermentationTime, 1),
  };
}

/** Compact recipe snapshot stored next to a saved protocol. */
export const recipeSnapshot = (state: PizzaState, recipe: RecipeResult) => ({
  numPizzas: state.numPizzas,
  doughBallWeight: state.doughBallWeight,
  waterPercent: state.waterPercent,
  saltPercent: state.saltPercent,
  isColdFerment: state.isColdFerment,
  coldFermentHours: state.coldFermentHours,
  fridgeTemp: state.fridgeTemp,
  roomTemp: state.roomTemp,
  bakeTime: state.bakeTime,
  flour: Math.round(recipe.flour),
  water: Math.round(recipe.water),
  salt: Math.round(recipe.salt),
  yeast: Number(recipe.yeast.toFixed(2)),
  requiredWaterTemp: Number(recipe.requiredWaterTemp.toFixed(1)),
});

/** Accept older/partial saved data without crashing: fill missing fields with defaults. */
export const normalizeProtocol = (raw: unknown): Protocol => {
  const base = emptyProtocol();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const out = { ...base } as Record<string, unknown>;
  for (const k of Object.keys(base)) {
    const def = (base as unknown as Record<string, unknown>)[k];
    const v = r[k];
    if (Array.isArray(def)) out[k] = Array.isArray(v) ? v.filter((x) => typeof x === 'string') : def;
    else if (typeof def === 'boolean') out[k] = typeof v === 'boolean' ? v : def;
    else out[k] = typeof v === 'string' ? v : def;
  }
  return out as unknown as Protocol;
};

/* ------------------------------------------------------------------ */
/* Draft (this device) + saved protocols (account)                     */
/* ------------------------------------------------------------------ */

const DRAFT_KEY = 'doughLogDraft';

export interface Draft {
  /** Id of the saved protocol this draft edits, if any. */
  id: string | null;
  data: Protocol;
  /** Auto fields the user has changed (no longer follow the calculator). */
  touched: AutoField[];
  /** The batch number is filled in automatically until the user types one. */
  batchAuto: boolean;
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return {
      id: typeof d.id === 'string' ? d.id : null,
      data: normalizeProtocol(d.data),
      touched: Array.isArray(d.touched)
        ? d.touched.filter((k: string) => (AUTO_FIELDS as readonly string[]).includes(k))
        : [],
      batchAuto: typeof d.batchAuto === 'boolean' ? d.batchAuto : !d.data?.batch,
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft | null): void {
  try {
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage blocked — the protocol still works for this visit */
  }
}

export interface SavedLog {
  id: string;
  bakedOn: string | null;
  title: string | null;
  protocol: Protocol;
  recipe: Record<string, unknown>;
  updatedAt: string;
}

interface LogRow {
  id: string;
  baked_on: string | null;
  title: string | null;
  protocol: unknown;
  recipe: Record<string, unknown> | null;
  updated_at: string;
}

const fromRow = (r: LogRow): SavedLog => ({
  id: r.id,
  bakedOn: r.baked_on,
  title: r.title,
  protocol: normalizeProtocol(r.protocol),
  recipe: r.recipe ?? {},
  updatedAt: r.updated_at,
});

const db = () => {
  if (!supabase) throw new Error('Saving needs Supabase');
  return supabase.from('dough_logs');
};

export async function listLogs(): Promise<SavedLog[]> {
  const { data, error } = await db()
    .select('id, baked_on, title, protocol, recipe, updated_at')
    .order('baked_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as LogRow[]).map(fromRow);
}

/** Insert (id null) or update; returns the saved row. */
export async function saveLog(
  id: string | null,
  protocol: Protocol,
  recipe: Record<string, unknown>,
  title: string,
): Promise<SavedLog> {
  const row = {
    baked_on: protocol.date || null,
    title: title.slice(0, 120) || null,
    protocol,
    recipe,
  };
  const query = id ? db().update(row).eq('id', id) : db().insert(row);
  const { data, error } = await query.select('id, baked_on, title, protocol, recipe, updated_at').single();
  if (error) throw error;
  return fromRow(data as LogRow);
}

export async function deleteLog(id: string): Promise<void> {
  const { error } = await db().delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* Shared helpers for section 04 and Deglabbet                         */
/* ------------------------------------------------------------------ */

export type RecipeSnapshot = ReturnType<typeof recipeSnapshot>;

/** "6 × 265 g · 66 % · 24 h kallt 4 °C" (empty if the snapshot is missing). */
export function recipeSummary(snapshot: Record<string, unknown> | null | undefined, lang: 'sv' | 'en'): string {
  const s = (snapshot ?? {}) as Partial<RecipeSnapshot>;
  if (!s.numPizzas || !s.doughBallWeight) return '';
  const ferment = s.isColdFerment
    ? `${s.coldFermentHours} h ${lang === 'sv' ? 'kallt' : 'cold'} ${s.fridgeTemp} °C`
    : `${s.roomTemp} °C`;
  return `${s.numPizzas} × ${s.doughBallWeight} g · ${s.waterPercent} % · ${ferment}`;
}

/** "19 okt. 2026" / "19 Oct 2026". */
export const formatLogDate = (iso: string | null | undefined, lang: 'sv' | 'en'): string =>
  iso
    ? new Date(`${iso}T12:00`).toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/** Print only the protocol sheet (see the print rules in index.css). */
export function printProtocol(): void {
  const root = document.documentElement;
  root.dataset.print = 'protocol';
  const done = () => {
    delete root.dataset.print;
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
  window.setTimeout(done, 1000); // browsers without afterprint
}

/** Does the protocol contain anything beyond what the calculator fills in? */
export const hasUserInput = (p: Protocol): boolean =>
  [
    p.flour1,
    p.flour2,
    p.blend,
    p.waterTemp,
    p.doughTemp,
    p.folds,
    p.gasJar,
    p.spread,
    p.jarLevel,
    p.maturity,
    p.lift,
    p.outcome,
    p.notes,
    p.autolyse,
  ].some((v) => v !== '') ||
  p.rheology.length > 0 ||
  p.opening.length > 0 ||
  p.jarPhoto;
