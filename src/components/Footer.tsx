import { Link } from 'react-router-dom';

const link =
  'transition-colors hover:text-brand-700 dark:hover:text-brand-300 underline decoration-dashed underline-offset-4';

/** Site footer. The privacy link must be reachable from the home page (Google OAuth requirement). */
const Footer = () => (
  <footer className="mx-auto mt-8 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-dashed border-paper-400 pt-6 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-muted dark:border-char-500 dark:text-char-400">
      <span>Pizza Calculator · pizzacalculator.se</span>
      <span aria-hidden="true">·</span>
      <Link to="/privacy" className={link}>
        Privacy
      </Link>
    </div>
  </footer>
);

export default Footer;
