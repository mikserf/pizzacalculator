/** Paper-and-ink class strings for the dough log form (section 04 and Deglabbet). */

export const labelText =
  'block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft dark:text-char-400';

export const inputClass =
  'w-full min-w-0 rounded-md border border-paper-400 bg-white/60 px-2.5 py-2 font-mono text-sm tabular-nums text-ink outline-none placeholder:text-ink-muted/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60 dark:text-char-100 dark:placeholder:text-char-400/60 dark:[color-scheme:dark]';

export const pill =
  'inline-flex items-center gap-1.5 rounded-full border border-paper-400 px-3 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-soft transition-all hover:border-brand-400 hover:text-brand-700 active:scale-[0.97] disabled:opacity-50 dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300';

export const pillSolid =
  'inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-50 transition-colors hover:bg-brand-700 active:scale-[0.97] disabled:opacity-50 dark:bg-char-100 dark:text-char-900 dark:hover:bg-brand-300';

export const chipClass = (on: boolean) =>
  [
    'rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-all active:scale-[0.97]',
    on
      ? 'border-ink bg-ink text-paper-50 dark:border-char-100 dark:bg-char-100 dark:text-char-900'
      : 'border-paper-400 bg-white/50 text-ink-soft hover:border-brand-400 hover:text-brand-700 dark:border-char-500 dark:bg-transparent dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300',
  ].join(' ');
