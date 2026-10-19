import React, { useMemo, useState } from 'react';
import { Wheat, Droplet, Diamond, FlaskConical, Scissors, Copy, Check, Printer, Share2 } from 'lucide-react';
import { PizzaState, RecipeResult } from '../types/pizza';
import { useLang } from '../hooks/useLang';

const T = {
  sv: {
    locale: 'sv-SE',
    heading: (n: number) => `Ditt recept för ${n} ${n === 1 ? 'pizza' : 'pizzor'}`,
    recipe: 'Degrecept',
    flour: 'Mjöl',
    water: 'Vatten',
    salt: 'Salt',
    yeast: 'Jäst',
    ingredient: 'Ingrediens',
    weight: 'Vikt',
    total: 'Total deg',
    mix: 'Blanda',
    bake: 'Grädda',
    cold: (h: number, temp: number) => `${h} h kallt · ${temp}°C`,
    at: (temp: number) => `vid ${temp}°C`,
    pickFuture: 'Välj en gräddningstid i framtiden för att skriva ut receptet.',
    waterAt: 'Blanda med vatten på',
    copy: 'Kopiera recept',
    copied: 'Kopierat',
    share: 'Dela recept',
    linkCopied: 'Länk kopierad',
    shareTitle: 'Pizzadegsrecept',
    print: 'Skriv ut',
    test: 'test',
    plainTitle: 'PIZZADEG',
    plainBake: 'Grädda',
    plainTotal: 'Total deg',
    plainFerment: 'Jäsning',
    plainColdAt: (h: number, temp: number) => ` (${h} h kallt vid ${temp}°C)`,
    plainAt: (temp: number) => ` vid ${temp}°C`,
    plainWater: 'Vattentemp',
  },
  en: {
    locale: 'en-GB',
    heading: (n: number) => `Your Recipe for ${n} ${n === 1 ? 'Pizza' : 'Pizzas'}`,
    recipe: 'Dough recipe',
    flour: 'Flour',
    water: 'Water',
    salt: 'Salt',
    yeast: 'Yeast',
    ingredient: 'Ingredient',
    weight: 'Weight',
    total: 'Total dough',
    mix: 'Mix',
    bake: 'Bake',
    cold: (h: number, temp: number) => `${h} h cold · ${temp}°C`,
    at: (temp: number) => `at ${temp}°C`,
    pickFuture: 'Pick a bake time in the future to print your recipe.',
    waterAt: 'Mix with water at',
    copy: 'Copy recipe',
    copied: 'Copied',
    share: 'Share recipe',
    linkCopied: 'Link copied',
    shareTitle: 'Pizza dough recipe',
    print: 'Print',
    test: 'test',
    plainTitle: 'PIZZA DOUGH',
    plainBake: 'Bake',
    plainTotal: 'Total dough',
    plainFerment: 'Fermentation',
    plainColdAt: (h: number, temp: number) => ` (${h} h cold at ${temp}°C)`,
    plainAt: (temp: number) => ` at ${temp}°C`,
    plainWater: 'Water temp',
  },
} as const;

interface RecipeDisplayProps {
  state: PizzaState;
  recipe: RecipeResult;
  showAdvanced?: boolean;
}

interface IngredientLine {
  Icon: typeof Wheat;
  label: string;
  italian: string;
  percent: string;
  value: string;
  sub?: string;
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

const grams = (v: number, decimals = 0) => `${v.toFixed(decimals)} g`;

const percent = (v: number) => {
  if (v >= 10) return `${Math.round(v)}%`;
  if (v >= 1) return `${v.toFixed(1)}%`;
  return `${v.toFixed(2)}%`;
};

const formatStamp = (d: Date, locale: string) =>
  d.toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const formatTime = (d: Date, locale: string) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

const formatDay = (d: Date, locale: string) =>
  d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

const formatDuration = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 60 ? `${h + 1}h 00m` : `${h}h ${String(m).padStart(2, '0')}m`;
};

/* ------------------------------------------------------------------ */
/* Decorative pieces                                                   */
/* ------------------------------------------------------------------ */

/** Deterministic barcode generated from the recipe numbers. */
function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    const out: { x: number; w: number }[] = [];
    let x = 0;
    const digits = seed.replace(/\D/g, '').padEnd(28, '7').slice(0, 28);
    for (let i = 0; i < digits.length; i++) {
      const d = Number(digits[i]);
      const w = 1 + (d % 3);
      out.push({ x, w });
      x += w + 1 + ((d + i) % 3);
    }
    return { bars: out, width: x };
  }, [seed]);

  return (
    <svg
      className="ticket-barcode"
      viewBox={`0 0 ${bars.width} 32`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {bars.bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={32} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Round rubber stamp showing the hydration, pressed slightly crooked onto the paper. */
function HydrationStamp({ hydration }: { hydration: number }) {
  return (
    <svg className="ticket-stamp" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path id="stamp-ring" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        <filter id="stamp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.55" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
      </defs>
      <g filter="url(#stamp-grain)" fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="56" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="34" strokeWidth="1.25" />
        <text fill="currentColor" stroke="none" fontSize="9.5" fontWeight="600">
          <textPath href="#stamp-ring" textLength="272" lengthAdjust="spacing">IDRATAZIONE · FATTO A MANO ·</textPath>
        </text>
        <text
          x="60"
          y="66"
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontSize="20"
          fontWeight="700"
        >
          {Math.round(hydration)}%
        </text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ state, recipe, showAdvanced = false }) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const t = T[useLang()];
  const { numPizzas, doughBallWeight, waterPercent, saltPercent, testTubeDough, isColdFerment } = state;

  const isValid = recipe.flour > 0 && recipe.fermentationTime > 0;
  const totalWeight = recipe.flour + recipe.water + recipe.salt + recipe.yeast;
  const yeastPercent = recipe.flour > 0 ? (recipe.yeast / recipe.flour) * 100 : 0;

  const now = new Date();
  const bakeAt = new Date(state.bakeTime);
  const ticketNo = `${String(bakeAt.getMonth() + 1).padStart(2, '0')}${String(bakeAt.getDate()).padStart(2, '0')}-${String(numPizzas).padStart(2, '0')}`;

  const show = (v: string) => (isValid ? v : '—');

  const ingredients: IngredientLine[] = [
    { Icon: Wheat, label: t.flour, italian: 'farina', percent: '100%', value: show(grams(recipe.flour)) },
    { Icon: Droplet, label: t.water, italian: 'acqua', percent: percent(waterPercent), value: show(grams(recipe.water)) },
    { Icon: Diamond, label: t.salt, italian: 'sale', percent: percent(saltPercent), value: show(grams(recipe.salt)) },
    {
      Icon: FlaskConical,
      label: t.yeast,
      italian: 'lievito fresco',
      percent: isValid ? percent(yeastPercent) : '—',
      value: show(grams(recipe.yeast, 2)),
    },
  ];

  const plainText = [
    `${t.plainTitle} — ${numPizzas} × ${doughBallWeight} g`,
    `${t.plainBake}: ${formatStamp(bakeAt, t.locale)}`,
    '',
    ...ingredients.map((i) => `${i.label.padEnd(12)} ${i.value.padStart(9)}  (${i.percent})`),
    '',
    `${t.plainTotal.padEnd(13)} ${grams(totalWeight)}`,
    `${t.plainFerment.padEnd(13)} ${formatDuration(recipe.fermentationTime)}${isColdFerment ? t.plainColdAt(state.coldFermentHours, state.fridgeTemp) : t.plainAt(state.roomTemp)}`,
    showAdvanced ? `${t.plainWater.padEnd(13)} ${recipe.requiredWaterTemp.toFixed(1)}°C` : '',
    '',
    window.location.href,
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n');

  /**
   * Phone share sheet where available; otherwise copy the link (it holds the whole recipe).
   * Only title + url: with extra text, iOS glues text and link into one plain message
   * instead of sending a link with a preview.
   */
  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: t.shareTitle, url });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return; // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="recipe mt-12 md:mt-0">
      <h2 className="font-display text-3xl font-bold mb-6 text-ink dark:text-char-100">
        {t.heading(numPizzas)}
      </h2>

      <div className="recipe-ticket">
        <article className="recipe-ticket-paper" aria-label={t.recipe}>
          {/* Masthead */}
          <header className="ticket-masthead">
            <div className="ticket-meta">
              <span className="ticket-label">pizzacalculator.se</span>
              <span className="ticket-label">Nº {ticketNo}</span>
            </div>
            <p className="ticket-title">Impasto per la pizza</p>
            <p className="ticket-subtitle">
              {String(numPizzas).padStart(2, '0')} × {doughBallWeight} g
              {testTubeDough && <span> + 80 g {t.test}</span>}
            </p>
          </header>

          <div className="ticket-rule ticket-rule--double" aria-hidden="true" />

          {/* Column heads */}
          <div className="ticket-colheads" aria-hidden="true">
            <span>{t.ingredient}</span>
            <span>%</span>
            <span>{t.weight}</span>
          </div>

          {/* Ingredient lines */}
          <ul className="ticket-list">
            {ingredients.map(({ Icon, label, italian, percent: pct, value, sub }) => (
              <li key={label} className="ticket-item">
                <div className="ticket-item-row">
                  <span className="ticket-item-name">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {label}
                      <em className="ticket-italian">{italian}</em>
                    </span>
                  </span>
                  <span className="ticket-leader" aria-hidden="true" />
                  <span className="ticket-item-pct">{pct}</span>
                  <span key={value} className="ticket-item-value">
                    {value}
                  </span>
                </div>
                {sub && <p className="ticket-item-sub">{sub}</p>}
              </li>
            ))}
          </ul>

          <div className="ticket-rule" aria-hidden="true" />

          {/* Total + stamp */}
          <div className="ticket-total">
            <div>
              <span className="ticket-total-label">{t.total}</span>
              <span className="ticket-total-value" key={totalWeight.toFixed(0)}>
                {show(grams(totalWeight))}
              </span>
            </div>
            <HydrationStamp hydration={waterPercent} />
          </div>

          <div className="ticket-rule" aria-hidden="true" />

          {/* Timeline */}
          {isValid ? (
            <div className="ticket-timeline">
              <div className="ticket-timeline-point">
                <span className="ticket-label">{t.mix}</span>
                <span className="ticket-timeline-time">{formatTime(now, t.locale)}</span>
                <span className="ticket-timeline-day">{formatDay(now, t.locale)}</span>
              </div>
              <div className="ticket-timeline-track">
                <span className="ticket-timeline-duration">{formatDuration(recipe.fermentationTime)}</span>
                <span className="ticket-timeline-line" aria-hidden="true" />
                <span className="ticket-timeline-detail">
                  {isColdFerment ? t.cold(state.coldFermentHours, state.fridgeTemp) : t.at(state.roomTemp)}
                </span>
              </div>
              <div className="ticket-timeline-point ticket-timeline-point--end">
                <span className="ticket-label">{t.bake}</span>
                <span className="ticket-timeline-time">{formatTime(bakeAt, t.locale)}</span>
                <span className="ticket-timeline-day">{formatDay(bakeAt, t.locale)}</span>
              </div>
            </div>
          ) : (
            <p className="ticket-warning">{t.pickFuture}</p>
          )}

          {showAdvanced && isValid && (
            <div className="ticket-note">
              <span className="ticket-label">{t.waterAt}</span>
              <span className="ticket-note-value">{recipe.requiredWaterTemp.toFixed(1)}°C</span>
            </div>
          )}

          {/* Footer */}
          <footer className="ticket-foot">
            <Barcode seed={`${ticketNo}${recipe.flour.toFixed(0)}${recipe.water.toFixed(0)}${doughBallWeight}`} />
            <p className="ticket-sign">Grazie &amp; buon appetito</p>
            <div className="ticket-footer" aria-hidden="true">
              <span className="ticket-footer-line" />
              <Scissors className="h-4 w-4" />
              <span className="ticket-footer-line" />
            </div>
          </footer>
        </article>
      </div>

      {/* Actions */}
      <div className="ticket-actions">
        <button type="button" onClick={handleCopy} disabled={!isValid} className="ticket-action">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? t.copied : t.copy}
        </button>
        <button type="button" onClick={handleShare} disabled={!isValid} className="ticket-action">
          {linkCopied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
          {linkCopied ? t.linkCopied : t.share}
        </button>
        <button type="button" onClick={() => window.print()} disabled={!isValid} className="ticket-action">
          <Printer className="h-4 w-4" aria-hidden="true" />
          {t.print}
        </button>
      </div>
    </div>
  );
};

export default RecipeDisplay;
