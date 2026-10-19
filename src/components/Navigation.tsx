import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Calculator, PartyPopper, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Lang } from '../types/party';
import AccountMenu from './AccountMenu';

const T = {
  sv: {
    calculator: 'Kalkylator',
    party: 'Party Mode',
    community: 'Community',
    light: 'Byt till ljust läge',
    dark: 'Byt till mörkt läge',
    openMenu: 'Öppna menyn',
    closeMenu: 'Stäng menyn',
    language: 'Språk',
  },
  en: {
    calculator: 'Calculator',
    party: 'Party Mode',
    community: 'Community',
    light: 'Switch to light mode',
    dark: 'Switch to dark mode',
    openMenu: 'Open main menu',
    closeMenu: 'Close main menu',
    language: 'Language',
  },
} as const;

const links = [
  { to: '/', key: 'calculator', Icon: Calculator },
  { to: '/party-mode', key: 'party', Icon: PartyPopper },
  { to: '/community', key: 'community', Icon: Users },
] as const;

const LANGS: { value: Lang; label: string; name: string }[] = [
  { value: 'sv', label: 'SV', name: 'Svenska' },
  { value: 'en', label: 'EN', name: 'English' },
];

const linkBase = 'transition-colors duration-200';
const linkActive = 'bg-ink text-paper-50 dark:bg-char-100 dark:text-char-900';
const linkIdle =
  'text-ink-soft hover:bg-paper-100 hover:text-brand-700 dark:text-char-300 dark:hover:bg-char-700 dark:hover:text-brand-300';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const t = T[lang];

  const langToggle = (
    <div
      role="group"
      aria-label={t.language}
      className="inline-flex items-center rounded-full border border-paper-400 p-0.5 dark:border-char-500"
    >
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          lang={l.value}
          aria-pressed={lang === l.value}
          aria-label={l.name}
          title={l.name}
          onClick={() => setLang(l.value)}
          className={`rounded-full px-2.5 py-1 font-mono text-[0.6875rem] font-medium tracking-[0.12em] ${linkBase} ${
            lang === l.value ? linkActive : 'text-ink-muted hover:text-ink dark:text-char-400 dark:hover:text-char-100'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  const closeMenu = () => setIsMenuOpen(false);
  const isActive = (path: string) =>
    location.pathname === path || (path === '/community' && location.pathname.startsWith('/pizza/'));

  const themeButton = (
    <button
      onClick={toggleTheme}
      className={`rounded-full p-2 ${linkBase} ${linkIdle}`}
      aria-label={isDark ? t.light : t.dark}
    >
      <div className="relative h-5 w-5">
        <Sun
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  );

  return (
    <nav className="border-b-[3px] border-double border-ink/40 bg-paper-50/85 backdrop-blur dark:border-char-400/40 dark:bg-char-900/85">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Wordmark */}
          <Link to="/" onClick={closeMenu} className="group flex items-baseline gap-2">
            <span className="font-display text-2xl font-normal italic text-ink transition-colors group-hover:text-brand-700 dark:text-char-100 dark:group-hover:text-brand-300">
              Pizza
            </span>
            <span className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.22em] text-ink-muted dark:text-char-400">
              Calculator
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-2 lg:flex">
            {links.map(({ to, key, Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={isActive(to) ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] ${linkBase} ${
                  isActive(to) ? linkActive : linkIdle
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t[key]}
              </Link>
            ))}
            <span className="mx-1 h-5 border-l border-dashed border-paper-400 dark:border-char-500" aria-hidden="true" />
            {langToggle}
            {themeButton}
            <AccountMenu />
          </div>

          {/* Mobile: theme toggle + menu button */}
          <div className="flex items-center gap-1 lg:hidden">
            {themeButton}
            <AccountMenu onNavigate={closeMenu} />
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className={`inline-flex items-center justify-center rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${linkBase} ${linkIdle}`}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">{isMenuOpen ? t.closeMenu : t.openMenu}</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="space-y-1 border-t border-dashed border-paper-400 px-3 pb-3 pt-2 dark:border-char-500">
            {links.map(({ to, key, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={closeMenu}
                aria-current={isActive(to) ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] ${linkBase} ${
                  isActive(to) ? linkActive : linkIdle
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {t[key]}
              </Link>
            ))}
            <div className="flex items-center justify-between px-3 pt-2">
              <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink-muted dark:text-char-400">
                {t.language}
              </span>
              {langToggle}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
