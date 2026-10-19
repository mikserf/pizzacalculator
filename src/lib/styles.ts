/** Shared paper-and-ink class strings for the community pages (same tokens as CalculatorControls). */

export const labelText =
  'font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft dark:text-char-400';

export const cardClass =
  'rounded-lg border border-paper-300 bg-paper-50 shadow-[0_1px_0_rgba(60,40,20,0.04),0_10px_24px_-14px_rgba(60,40,20,0.22)] dark:border-char-600 dark:bg-char-800 dark:shadow-none';

export const pillOutline =
  'inline-flex items-center gap-1.5 rounded-full border border-paper-400 px-3 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-soft transition-all hover:border-brand-400 hover:text-brand-700 active:scale-[0.97] disabled:opacity-50 dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300';

export const pillSolid =
  'inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-50 transition-colors hover:bg-brand-700 active:scale-[0.97] disabled:opacity-50 dark:bg-char-100 dark:text-char-900 dark:hover:bg-brand-300';

export const quietLink =
  'font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-brand-700 dark:text-char-400 dark:hover:text-brand-300';

export const segBtn = (active: boolean) =>
  [
    'flex items-center justify-center gap-2 rounded px-3 py-2 font-mono text-xs font-medium uppercase tracking-[0.12em] transition-all sm:px-4',
    active
      ? 'bg-ink text-paper-50 dark:bg-char-100 dark:text-char-900'
      : 'text-ink-muted hover:text-ink dark:text-char-400 dark:hover:text-char-100',
  ].join(' ');
