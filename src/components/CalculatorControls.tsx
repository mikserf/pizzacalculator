import React, { useState, useEffect } from 'react';
import { Minus, Plus, Info, Wheat, Clock, Settings2 } from 'lucide-react';
import { PizzaState } from '../types/pizza';
import { useLang } from '../hooks/useLang';

const T = {
  sv: {
    decrease: 'Minska',
    increase: 'Öka',
    dough: 'Deg',
    ballWeight: 'Degbollens vikt',
    numPizzas: 'Antal pizzor',
    pcs: 'st',
    water: 'Vatten',
    hydration: 'Hydrering',
    salt: 'Salt',
    fermentBake: 'Jäsning & gräddning',
    method: 'Jäsmetod',
    roomTemp: 'Rumstemp',
    coldFerment: 'Kalljäsning',
    coldTime: 'Kalljäsningstid',
    fridgeTemp: 'Kylskåpstemperatur',
    whenBake: 'När vill du grädda?',
    ovenTime: 'Ugnstid',
    in6: 'Om 6 h',
    in12: 'Om 12 h',
    tomorrow: 'Om 24 timmar',
    in48: 'Om 48 h',
    roomTemperature: 'Rumstemperatur',
    advanced: 'Avancerade inställningar',
    testTube: 'Använd 80 g deg till provrör',
    desiredTemp: 'Önskad slutlig degtemperatur',
    friction: 'Friktionsfaktor (degblandare)',
    whatFriction: 'Vad är friktion i degblandaren?',
    close: 'Stäng',
    gotIt: 'Uppfattat',
    modalTitle: 'Vad är friktion i degblandaren?',
    modalIntro:
      'Tänk på det som när du gnuggar händerna för att värma dem. När du knådar deg skapar friktionen mellan degen, kroken och skålen värme. Friktionsfaktorn är bara ett tal som säger hur mycket värme just din blandare skapar.',
    whyTitle: 'Varför spelar det roll?',
    whyBody:
      'Jäst är kräsen med temperatur. Att styra degens sluttemperatur är hemligheten bakom en perfekt jäsning och förutsägbara resultat varje gång. Med din friktionsfaktor kan du justera vattentemperaturen så att degen hamnar rätt.',
    howTitle: 'Så tar du fram din friktionsfaktor (engångstest)',
    howMeasure: 'Mät temperaturer',
    howMeasureBody: ': Innan du blandar, mät temperaturen på rummet, mjölet och vattnet.',
    howMix: 'Blanda',
    howMixBody: ': Gör degen som vanligt.',
    howFinal: 'Degens sluttemperatur',
    howFinalBody: ': Mät degens temperatur direkt när den är färdigblandad.',
    calcTitle: 'Räkna ut',
    calcIntro: 'Använd den här enkla formeln:',
    formula: 'Friktionsfaktor = (3 × degens sluttemp) − (rumstemp + mjöltemp + vattentemp)',
  },
  en: {
    decrease: 'Decrease',
    increase: 'Increase',
    dough: 'Dough',
    ballWeight: 'Dough Ball Weight',
    numPizzas: 'Number of Pizzas',
    pcs: 'pcs',
    water: 'Water',
    hydration: 'Hydration',
    salt: 'Salt',
    fermentBake: 'Fermentation & Baking',
    method: 'Fermentation Method',
    roomTemp: 'Room Temp',
    coldFerment: 'Cold Ferment',
    coldTime: 'Cold Fermentation Time',
    fridgeTemp: 'Fridge Temperature',
    whenBake: 'When do you want to bake?',
    ovenTime: 'Oven time',
    in6: 'In 6h',
    in12: 'In 12h',
    tomorrow: 'In 24 hours',
    in48: 'In 48h',
    roomTemperature: 'Room Temperature',
    advanced: 'Advanced Settings',
    testTube: 'Use 80g dough for test tube',
    desiredTemp: 'Desired Final Dough Temp',
    friction: 'Mixer Friction Factor',
    whatFriction: 'What is mixer friction?',
    close: 'Close',
    gotIt: 'Got it',
    modalTitle: 'What is Mixer Friction?',
    modalIntro:
      'Think of it like rubbing your hands together to warm them up. When you mix dough, the friction between the dough, hook, and bowl creates heat. The Mixer Friction Factor is just a number that tells you how much heat your specific mixer creates.',
    whyTitle: 'Why Does It Matter?',
    whyBody:
      'Yeast is picky about temperature. Controlling your final dough temperature is the secret to perfect fermentation and predictable results every time you bake. By knowing your friction factor, you can adjust your water temperature perfectly to hit that "sweet spot" for your dough.',
    howTitle: 'How to Find Your Friction Factor (One-Time Test)',
    howMeasure: 'Measure Temps',
    howMeasureBody: ': Before mixing, get the temperature of your Room, Flour, and Water.',
    howMix: 'Mix',
    howMixBody: ': Make your dough as you normally would.',
    howFinal: 'Final Dough Temp',
    howFinalBody: ": As soon as it's done mixing, take the temperature of the dough.",
    calcTitle: 'Calculate',
    calcIntro: 'Use this simple formula:',
    formula: 'Friction Factor = (3 × Final Dough Temp) − (Room Temp + Flour Temp + Water Temp)',
  },
} as const;

interface CalculatorControlsProps {
  state: PizzaState;
  onUpdate: (updates: Partial<PizzaState>) => void;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const round = (v: number, decimals: number) => Number(v.toFixed(decimals));

const formatNumber = (v: number, decimals: number) =>
  decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));

const formatDateTime = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const addHoursFromNow = (hours: number): string =>
  formatDateTime(new Date(Date.now() + hours * 3600 * 1000));

/* ------------------------------------------------------------------ */
/* Primitive controls                                                  */
/* ------------------------------------------------------------------ */

const labelText = 'block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft dark:text-char-400';
const hintText = 'font-display text-sm font-normal italic text-ink-muted dark:text-char-400/80';

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <span className={labelText}>{children}</span>
      {hint && <span className={hintText}>{hint}</span>}
    </div>
  );
}

interface StepperProps {
  id: string;
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  hint?: string;
  onChange: (value: number) => void;
}

function Stepper({
  id,
  label,
  value,
  unit,
  min,
  max,
  step,
  decimals = 0,
  hint,
  onChange,
}: StepperProps) {
  const [draft, setDraft] = useState(() => formatNumber(value, decimals));

  useEffect(() => {
    setDraft(formatNumber(value, decimals));
  }, [value, decimals]);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const bump = (delta: number) => onChange(clamp(round(value + delta, decimals)));

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      setDraft(formatNumber(value, decimals));
      return;
    }
    const next = clamp(round(parsed, decimals));
    setDraft(formatNumber(next, decimals));
    onChange(next);
  };

  const t = T[useLang()];
  const stepperBtn =
    'w-12 shrink-0 flex items-center justify-center text-brand-600 dark:text-brand-300 hover:bg-paper-100 dark:hover:bg-char-700 active:bg-paper-200 dark:active:bg-char-600 transition-colors';

  return (
    <div>
      {label && (
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor={id} className={labelText}>
            {label}
          </label>
          {hint && <span className={hintText}>{hint}</span>}
        </div>
      )}
      <div className="flex h-12 items-stretch overflow-hidden rounded-md border border-paper-400 bg-white/60 transition-shadow focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60">
        <button type="button" aria-label={`${t.decrease} ${label || id}`} onClick={() => bump(-step)} className={stepperBtn}>
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5 border-x border-dashed border-paper-400 dark:border-char-500">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-20 bg-transparent text-center font-mono text-lg font-semibold tabular-nums text-ink outline-none dark:text-char-100"
          />
          {unit && <span className="font-mono text-xs text-ink-muted dark:text-char-400">{unit}</span>}
        </div>
        <button type="button" aria-label={`${t.increase} ${label || id}`} onClick={() => bump(step)} className={stepperBtn}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

interface ChipGroupProps {
  label: string;
  unit: string;
  options: number[];
  value: number;
  columns?: number;
  onChange: (value: number) => void;
}

function ChipGroup({ label, unit, options, value, columns = 4, onChange }: ChipGroupProps) {
  return (
    <div role="group" aria-label={label}>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt)}
              className={[
                'h-11 rounded-md border font-mono text-sm font-medium tabular-nums transition-all active:scale-[0.97]',
                selected
                  ? 'border-ink bg-ink text-paper-50 dark:border-char-100 dark:bg-char-100 dark:text-char-900'
                  : 'border-paper-400 bg-white/50 text-ink-soft hover:border-brand-400 hover:text-brand-700 dark:border-char-500 dark:bg-transparent dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300',
              ].join(' ')}
            >
              {opt}
              {unit}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SegmentedProps<T extends string | boolean> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

function Segmented<T extends string | boolean>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label}>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-2 gap-1 rounded-md border border-paper-400 p-1 dark:border-char-500">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={[
                'rounded py-2 font-mono text-xs font-medium uppercase tracking-[0.12em] transition-all',
                selected
                  ? 'bg-ink text-paper-50 dark:bg-char-100 dark:text-char-900'
                  : 'text-ink-muted hover:text-ink dark:text-char-400 dark:hover:text-char-100',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SectionCardProps {
  icon: React.ReactNode;
  index: string;
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}

function SectionCard({ icon, index, title, children, headerAction, collapsible, open, onToggle }: SectionCardProps) {
  const HeaderContent = (
    <>
      <span className="font-mono text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">{index}</span>
      <span className="font-display text-xl font-bold text-ink dark:text-char-100">{title}</span>
    </>
  );

  return (
    <section className="rounded-lg border border-paper-300 bg-paper-50 shadow-[0_1px_0_rgba(60,40,20,0.04),0_10px_24px_-14px_rgba(60,40,20,0.22)] dark:border-char-600 dark:bg-char-800 dark:shadow-none">
      <div
        className={[
          'flex items-center justify-between px-5 pb-4 pt-5 sm:px-6',
          !collapsible || open ? 'border-b border-dashed border-paper-400 dark:border-char-500' : '',
        ].join(' ')}
      >
        {collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="flex flex-1 items-baseline gap-3 text-left"
          >
            {HeaderContent}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={[
                'ml-auto h-5 w-5 self-center text-ink-muted transition-transform dark:text-char-400',
                open ? 'rotate-180' : 'rotate-0',
              ].join(' ')}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 15.75a.75.75 0 0 1-.53-.22l-6-6a.75.75 0 1 1 1.06-1.06L12 13.94l5.47-5.47a.75.75 0 1 1 1.06 1.06l-6 6a.75.75 0 0 1-.53.22Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <div className="flex flex-1 items-baseline gap-3">
            {HeaderContent}
            <span className="ml-auto self-center text-ink-muted dark:text-char-400">{icon}</span>
          </div>
        )}
        {headerAction}
      </div>
      {(!collapsible || open) && <div className="space-y-5 p-5 sm:p-6">{children}</div>}
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-paper-400 px-4 py-3 dark:border-char-500">
      <span className="text-sm font-medium text-ink dark:text-char-100">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-brand-600 dark:bg-brand-400' : 'bg-paper-400 dark:bg-char-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const CalculatorControls: React.FC<CalculatorControlsProps> = ({ state, onUpdate, showAdvanced = false, onToggleAdvanced }) => {
  const [showFrictionInfo, setShowFrictionInfo] = useState(false);
  const t = T[useLang()];

  const handleDoughBallWeight = (val: number) => onUpdate({ doughBallWeight: val });
  const handleNumPizzas = (val: number) => onUpdate({ numPizzas: val });
  const handleWaterPercent = (val: number) => onUpdate({ waterPercent: val, moreWater: val >= 69 });
  const handleSaltPercent = (val: number) => onUpdate({ saltPercent: Number(val.toFixed(1)) });
  const handleColdFermentHours = (val: number) => onUpdate({ coldFermentHours: val });
  const handleFriction = (val: number) => onUpdate({ frictionFactor: Number(val.toFixed(1)) });

  const roomTempOptions = Array.from({ length: 8 }, (_, i) => i + 19);
  const fridgeTempOptions = Array.from({ length: 6 }, (_, i) => i + 2);

  return (
    <div className="controls space-y-6">
      {/* ------------------------------ Dough ------------------------------ */}
      <SectionCard icon={<Wheat className="h-4 w-4" aria-hidden="true" />} index="01" title={t.dough}>
        <Stepper
          id="doughBallWeight"
          label={t.ballWeight}
          unit="g"
          value={state.doughBallWeight}
          min={200}
          max={1000}
          step={5}
          onChange={handleDoughBallWeight}
        />
        <Stepper
          id="numPizzas"
          label={t.numPizzas}
          unit={t.pcs}
          value={state.numPizzas}
          min={1}
          max={12}
          step={1}
          onChange={handleNumPizzas}
        />
        <Stepper
          id="waterPercent"
          label={t.water}
          unit="%"
          value={state.waterPercent ?? 66}
          min={50}
          max={85}
          step={1}
          hint={t.hydration}
          onChange={handleWaterPercent}
        />
        <Stepper
          id="saltPercent"
          label={t.salt}
          unit="%"
          value={state.saltPercent ?? 2.8}
          min={1.5}
          max={3.5}
          step={0.1}
          decimals={1}
          onChange={handleSaltPercent}
        />
      </SectionCard>

      {/* ---------------------- Fermentation & Baking --------------------- */}
      <SectionCard icon={<Clock className="h-4 w-4" aria-hidden="true" />} index="02" title={t.fermentBake}>
        <Segmented<boolean>
          label={t.method}
          options={[
            { value: false, label: t.roomTemp },
            { value: true, label: t.coldFerment },
          ]}
          value={state.isColdFerment}
          onChange={(val) => onUpdate({ isColdFerment: val })}
        />

        {state.isColdFerment && (
          <>
            <Stepper
              id="coldFermentHours"
              label={t.coldTime}
              unit="h"
              value={state.coldFermentHours}
              min={0}
              max={168}
              step={1}
              onChange={handleColdFermentHours}
            />
            <ChipGroup
              label={t.fridgeTemp}
              unit="°C"
              options={fridgeTempOptions}
              value={state.fridgeTemp}
              columns={3}
              onChange={(val) => onUpdate({ fridgeTemp: val })}
            />
          </>
        )}

        <div>
          <FieldLabel hint={t.ovenTime}>{t.whenBake}</FieldLabel>
          <input
            type="datetime-local"
            id="bakeTime"
            value={state.bakeTime}
            onChange={(e) => onUpdate({ bakeTime: e.target.value })}
            className="w-full rounded-md border border-paper-400 bg-white/60 p-3 font-mono tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60 dark:text-char-100 dark:[color-scheme:dark]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: t.in6, hours: 6 },
              { label: t.in12, hours: 12 },
              { label: t.tomorrow, hours: 24 },
              { label: t.in48, hours: 48 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onUpdate({ bakeTime: addHoursFromNow(preset.hours) })}
                className="flex-auto whitespace-nowrap rounded-full border border-paper-400 px-3 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-soft transition-all hover:border-brand-400 hover:text-brand-700 active:scale-[0.97] dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <ChipGroup
          label={t.roomTemperature}
          unit="°C"
          options={roomTempOptions}
          value={state.roomTemp}
          columns={4}
          onChange={(val) => onUpdate({ roomTemp: val })}
        />
      </SectionCard>

      {/* ---------------------------- Advanced ---------------------------- */}
      <SectionCard
        icon={<Settings2 className="h-4 w-4" aria-hidden="true" />}
        index="03"
        title={t.advanced}
        collapsible
        open={showAdvanced}
        onToggle={onToggleAdvanced}
      >
        <ToggleRow
          label={t.testTube}
          checked={state.testTubeDough}
          onChange={(val) => onUpdate({ testTubeDough: val })}
        />
        <ChipGroup
          label={t.desiredTemp}
          unit="°C"
          options={roomTempOptions}
          value={state.desiredDoughTemp}
          columns={4}
          onChange={(val) => onUpdate({ desiredDoughTemp: val })}
        />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="frictionFactor" className={labelText}>
              {t.friction}
            </label>
            <button
              type="button"
              aria-label={t.whatFriction}
              onClick={() => setShowFrictionInfo(true)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-paper-100 hover:text-brand-700 active:bg-paper-200 dark:text-char-400 dark:hover:bg-char-700 dark:hover:text-brand-300"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <Stepper
            id="frictionFactor"
            label=""
            value={state.frictionFactor}
            min={0}
            max={10}
            step={0.1}
            decimals={1}
            onChange={handleFriction}
          />
        </div>
      </SectionCard>

      {/* ------------------------- Friction info modal -------------------- */}
      {showFrictionInfo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="friction-info-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          <div className="absolute inset-0 bg-char-950/60 backdrop-blur-[2px]" onClick={() => setShowFrictionInfo(false)} />
          <div className="relative m-0 w-full rounded-t-xl border border-paper-300 bg-paper-50 p-6 text-ink shadow-xl sm:m-4 sm:max-w-lg sm:rounded-lg sm:p-8 dark:border-char-600 dark:bg-char-800 dark:text-char-100">
            <div className="flex items-start justify-between gap-4">
              <h2 id="friction-info-title" className="font-display text-xl font-bold sm:text-2xl">
                {t.modalTitle}
              </h2>
              <button
                type="button"
                aria-label={t.close}
                onClick={() => setShowFrictionInfo(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-paper-100 active:bg-paper-200 dark:hover:bg-char-700 dark:active:bg-char-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-6">
              <p>{t.modalIntro}</p>
              <div>
                <h3 className="font-semibold">{t.whyTitle}</h3>
                <p>{t.whyBody}</p>
              </div>
              <div>
                <h3 className="font-semibold">{t.howTitle}</h3>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <span className="font-semibold">{t.howMeasure}</span>
                    {t.howMeasureBody}
                  </li>
                  <li>
                    <span className="font-semibold">{t.howMix}</span>
                    {t.howMixBody}
                  </li>
                  <li>
                    <span className="font-semibold">{t.howFinal}</span>
                    {t.howFinalBody}
                  </li>
                </ul>
                <div className="mt-3">
                  <h4 className="font-semibold">{t.calcTitle}</h4>
                  <p>{t.calcIntro}</p>
                  <div className="mt-2 rounded-md border border-dashed border-paper-400 bg-paper-100 p-3 font-mono text-[0.8125rem] font-medium text-brand-800 dark:border-char-500 dark:bg-char-700 dark:text-brand-200">
                    {t.formula}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFrictionInfo(false)}
                className="rounded-full bg-ink px-5 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-50 transition-colors hover:bg-brand-700 dark:bg-char-100 dark:text-char-900 dark:hover:bg-brand-300"
              >
                {t.gotIt}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorControls;
