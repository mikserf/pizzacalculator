import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  /** 0–5; fractional values are shown as partly filled stars. */
  value: number;
  /** Makes the stars buttons. */
  onRate?: (score: number) => void;
  size?: 'sm' | 'lg';
  disabled?: boolean;
  /** Accessible label prefix for the buttons, e.g. "Rate". */
  rateLabel?: string;
}

const RatingStars = ({ value, onRate, size = 'sm', disabled, rateLabel = 'Rate' }: RatingStarsProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const dim = size === 'lg' ? 'h-7 w-7' : 'h-4 w-4';

  const star = (i: number) => {
    const fill = Math.max(0, Math.min(1, shown - i)); // 0..1 for star i (0-based)
    return (
      <span className={`relative inline-block ${dim}`} aria-hidden="true">
        <Star className={`absolute inset-0 ${dim} text-paper-400 dark:text-char-500`} strokeWidth={1.5} />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
          <Star className={`${dim} fill-brand-500 text-brand-600 dark:fill-brand-400 dark:text-brand-300`} strokeWidth={1.5} />
        </span>
      </span>
    );
  };

  if (!onRate) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value.toFixed(1)} / 5`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i}>{star(i)}</span>
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          aria-label={`${rateLabel} ${n}/5`}
          aria-pressed={value === n}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(null)}
          onClick={() => onRate(n)}
          className="rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-50"
        >
          {star(n - 1)}
        </button>
      ))}
    </span>
  );
};

export default RatingStars;
