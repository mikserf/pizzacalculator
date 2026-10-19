import type { PizzaState } from '../types/pizza';

/**
 * Shareable recipe links: the calculator's settings live in the address, e.g.
 * pizzacalculator.se/?w=280&h=68&cf=1&ch=48&t=50
 * Only values that differ from the defaults are written, and the bake time is
 * stored as "hours from now" (t) so a shared link never opens in the past.
 */

type NumKey = 'doughBallWeight' | 'numPizzas' | 'waterPercent' | 'saltPercent' | 'roomTemp' | 'coldFermentHours' | 'fridgeTemp' | 'desiredDoughTemp' | 'frictionFactor';
type BoolKey = 'isColdFerment' | 'testTubeDough';

// Same limits as the calculator controls.
const NUMBERS: { key: NumKey; param: string; min: number; max: number; decimals: number }[] = [
  { key: 'doughBallWeight', param: 'w', min: 200, max: 1000, decimals: 0 },
  { key: 'numPizzas', param: 'n', min: 1, max: 12, decimals: 0 },
  { key: 'waterPercent', param: 'h', min: 50, max: 85, decimals: 0 },
  { key: 'saltPercent', param: 's', min: 1.5, max: 3.5, decimals: 1 },
  { key: 'roomTemp', param: 'rt', min: 19, max: 26, decimals: 0 },
  { key: 'coldFermentHours', param: 'ch', min: 0, max: 168, decimals: 0 },
  { key: 'fridgeTemp', param: 'ft', min: 2, max: 7, decimals: 0 },
  { key: 'desiredDoughTemp', param: 'dt', min: 19, max: 26, decimals: 0 },
  { key: 'frictionFactor', param: 'ff', min: 0, max: 10, decimals: 1 },
];
const BOOLEANS: { key: BoolKey; param: string }[] = [
  { key: 'isColdFerment', param: 'cf' },
  { key: 'testTubeDough', param: 'tt' },
];
const HOURS_PARAM = 't';
const MAX_HOURS = 24 * 14;

/** "2026-10-20T19:00" in local time, the format the bake-time input uses. */
export const formatLocalDateTime = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Settings found in a query string (invalid or out-of-range values are ignored). */
export function stateFromSearch(search: string): Partial<PizzaState> {
  const params = new URLSearchParams(search);
  const out: Partial<PizzaState> = {};
  for (const { key, param, min, max, decimals } of NUMBERS) {
    const raw = params.get(param);
    if (raw === null) continue;
    const v = Number(raw);
    if (Number.isFinite(v)) out[key] = Number(Math.min(max, Math.max(min, v)).toFixed(decimals));
  }
  for (const { key, param } of BOOLEANS) {
    const raw = params.get(param);
    if (raw !== null) out[key] = raw === '1';
  }
  const hours = Number(params.get(HOURS_PARAM));
  if (params.has(HOURS_PARAM) && Number.isFinite(hours) && hours > 0 && hours <= MAX_HOURS) {
    const at = new Date(Date.now() + hours * 3600 * 1000);
    at.setMinutes(Math.round(at.getMinutes() / 5) * 5, 0, 0); // tidy to 5 minutes
    out.bakeTime = formatLocalDateTime(at);
  }
  if (out.waterPercent !== undefined) out.moreWater = out.waterPercent >= 69;
  return out;
}

/** Query string for the current settings: only what differs from the defaults. */
export function searchFromState(state: PizzaState, defaults: PizzaState): string {
  const params = new URLSearchParams();
  for (const { key, param, decimals } of NUMBERS) {
    if (state[key] !== defaults[key]) params.set(param, state[key].toFixed(decimals).replace(/\.0+$/, ''));
  }
  for (const { key, param } of BOOLEANS) {
    if (state[key] !== defaults[key]) params.set(param, state[key] ? '1' : '0');
  }
  if (state.bakeTime !== defaults.bakeTime) {
    const hours = (new Date(state.bakeTime).getTime() - Date.now()) / 3600000;
    if (hours > 0) params.set(HOURS_PARAM, String(Math.round(hours * 4) / 4)); // quarter hours
  }
  return params.toString();
}
