import React from 'react';
import { GAS_JAR, LIFT, OPENING, OUTCOME, Protocol, RHEOLOGY, SPREAD } from '../lib/doughLog';
import type { ProtocolText } from '../lib/doughLogText';
import { chipClass, inputClass, labelText } from '../lib/protocolStyles';

/* ------------------------------------------------------------------ */
/* Small building blocks (same paper-and-ink look as CalculatorControls) */
/* ------------------------------------------------------------------ */



export function Part({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
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

export function Field({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
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
/* The form: date/batch + the six parts of the protocol               */
/* ------------------------------------------------------------------ */

export type ToggleManyKey = 'rheology' | 'opening';
export type ToggleOneKey = 'gasJar' | 'spread' | 'lift' | 'outcome' | 'autolyse';

interface ProtocolFormProps {
  p: Protocol;
  t: ProtocolText;
  set: <K extends keyof Protocol>(key: K, value: Protocol[K]) => void;
  toggleIn: (key: ToggleManyKey, value: string) => void;
  toggleOne: (key: ToggleOneKey, value: string) => void;
  /** Calculator targets shown as hints in the measured-temperature fields. */
  targets?: { waterTemp?: number; doughTemp?: number };
}

/** Shared by section 04 in the calculator and the Deglabbet page. */
const ProtocolForm = ({ p, t, set, toggleIn, toggleOne, targets }: ProtocolFormProps) => {
  const optionLabel = (k: string) => t.options[k] ?? k;
  const target = (v?: number) => (v !== undefined && Number.isFinite(v) && v > 0 ? `${t.target} ${v.toFixed(1)}` : '');

  return (
    <>
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
              <input
                value={p.flour1}
                maxLength={60}
                onChange={(e) => set('flour1', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.batchNo}>
              <input
                value={p.flour1Batch}
                maxLength={30}
                onChange={(e) => set('flour1Batch', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.flour2}>
              <input
                value={p.flour2}
                maxLength={60}
                onChange={(e) => set('flour2', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.batchNo}>
              <input
                value={p.flour2Batch}
                maxLength={30}
                onChange={(e) => set('flour2Batch', e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="col-span-2">
              <Field label={t.blend}>
                <input
                  value={p.blend}
                  maxLength={80}
                  onChange={(e) => set('blend', e.target.value)}
                  className={inputClass}
                />
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
            <input
              inputMode="decimal"
              value={p.waterTemp}
              placeholder={target(targets?.waterTemp)}
              onChange={(e) => set('waterTemp', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t.doughTemp} unit="°C">
            <input
              inputMode="decimal"
              value={p.doughTemp}
              placeholder={target(targets?.doughTemp)}
              onChange={(e) => set('doughTemp', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t.roomTemp} unit="°C">
            <input
              inputMode="decimal"
              value={p.roomTemp}
              onChange={(e) => set('roomTemp', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t.fermentTemp} unit="°C">
            <input
              inputMode="decimal"
              value={p.fermentTemp}
              onChange={(e) => set('fermentTemp', e.target.value)}
              className={inputClass}
            />
          </Field>
          <div>
            <span className={`mb-1.5 ${labelText}`}>{t.autolyse}</span>
            <div className="flex gap-2" role="group" aria-label={t.autolyse}>
              {(['yes', 'no'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={p.autolyse === v}
                  onClick={() => toggleOne('autolyse', v)}
                  className={`${chipClass(p.autolyse === v)} flex-1 text-center`}
                >
                  {t[v]}
                </button>
              ))}
            </div>
          </div>
          <Field label={t.folds} unit={t.foldsUnit}>
            <input
              inputMode="numeric"
              value={p.folds}
              onChange={(e) => set('folds', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t.fermentStart}>
            <input
              type="time"
              value={p.fermentStart}
              onChange={(e) => set('fermentStart', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t.totalHours} unit="h">
            <input
              inputMode="decimal"
              value={p.totalHours}
              onChange={(e) => set('totalHours', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Part>

      {/* 3 · The two clocks */}
      <Part n={3} title={t.s3}>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              {
                title: t.clock1,
                key: 'gasJar',
                values: GAS_JAR,
                unit: '',
                text: 'jarLevel',
                textLabel: t.jarLevel,
              },
              {
                title: t.clock2,
                key: 'spread',
                values: SPREAD,
                unit: 'cm',
                text: 'maturity',
                textLabel: t.maturity,
              },
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
                {c.unit && (
                  <span className="self-center font-mono text-xs text-ink-muted dark:text-char-400">{c.unit}</span>
                )}
              </div>
              <div className="mt-3">
                <Field label={c.textLabel}>
                  <input
                    value={p[c.text]}
                    maxLength={60}
                    onChange={(e) => set(c.text, e.target.value)}
                    className={inputClass}
                  />
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
                <button
                  key={k}
                  type="button"
                  aria-pressed={p.rheology.includes(k)}
                  onClick={() => toggleIn('rheology', k)}
                  className={chipClass(p.rheology.includes(k))}
                >
                  {optionLabel(k)}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={p.jarPhoto}
                onClick={() => set('jarPhoto', !p.jarPhoto)}
                className={chipClass(p.jarPhoto)}
              >
                {t.jarPhoto}
              </button>
            </div>
          </div>
          <div>
            <p className={`mb-2 ${labelText}`}>{t.openingTitle}</p>
            <div className="flex flex-wrap gap-1.5">
              {OPENING.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={p.opening.includes(k)}
                  onClick={() => toggleIn('opening', k)}
                  className={chipClass(p.opening.includes(k))}
                >
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
                  <button
                    key={k}
                    type="button"
                    aria-pressed={p[key] === k}
                    onClick={() => toggleOne(key, k)}
                    className={chipClass(p[key] === k)}
                  >
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
    </>
  );
};

export default ProtocolForm;
