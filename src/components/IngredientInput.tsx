import { useEffect, useId, useRef, useState } from 'react';
import type { Lang } from '../types/party';
import { searchIngredients } from '../lib/ingredients';

interface IngredientInputProps {
  value: string;
  onChange: (value: string) => void;
  lang: Lang;
  ariaLabel: string;
  placeholder: string;
  className: string;
}

/**
 * Ingredient name field with its own suggestion list. (The browser's <datalist>
 * shows nothing in iPhone Safari, so suggestions are rendered by the app.)
 */
const IngredientInput = ({ value, onChange, lang, ariaLabel, placeholder, className }: IngredientInputProps) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = open ? searchIngredients(value, lang) : [];
  const showList = suggestions.length > 0;
  const listRef = useRef<HTMLUListElement>(null);

  // The editor scrolls; make sure the whole list is visible rather than clipped
  // behind the Save bar (or the phone keyboard).
  useEffect(() => {
    if (showList) listRef.current?.scrollIntoView({ block: 'nearest' });
  }, [showList, suggestions.length]);

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="relative min-w-0">
      <input
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (i + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault(); // pick the suggestion instead of submitting the form
            choose(suggestions[active]);
          } else if (e.key === 'Escape') {
            e.stopPropagation(); // close the list, not the whole editor
            setOpen(false);
          }
        }}
        className={`${className} w-full`}
      />
      {showList && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 min-w-[11rem] overflow-y-auto rounded-md border border-paper-300 bg-paper-50 py-1 shadow-[0_10px_24px_-10px_rgba(60,40,20,0.35)] dark:border-char-500 dark:bg-char-700 dark:shadow-none"
        >
          {suggestions.map((name, i) => (
            <li
              key={name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // pointerdown + preventDefault keeps focus in the input (no blur before the pick), incl. touch.
              onPointerDown={(e) => {
                e.preventDefault();
                choose(name);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2.5 text-sm ${
                i === active
                  ? 'bg-paper-200 text-ink dark:bg-char-600 dark:text-char-100'
                  : 'text-ink-soft dark:text-char-300'
              }`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IngredientInput;
