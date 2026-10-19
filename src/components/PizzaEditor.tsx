import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Lang, LocalizedText, PartyPizza, PizzaIngredient } from '../types/party';
import { newPizzaId } from '../hooks/usePizzaStore';
import { prepareImage, PreparedImage } from '../lib/image';
import { photoUrl } from '../lib/photos';
import { useAuth, validNickname } from '../contexts/AuthContext';
import {
  canonicalUnit,
  findIngredient,
  ingredientSuggestions,
  localizeIngredient,
  UNIT_CODES,
  UNITS,
  unitCode,
  UnitCode,
} from '../lib/ingredients';

/** Select value for a unit that isn't in the fixed list (kept from older pizzas). */
const CUSTOM_UNIT = 'custom';

/** What should happen to the pizza's photo when it is saved. */
export type PhotoChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'new'; image: PreparedImage };

const T = {
  sv: {
    newTitle: 'Ny pizza',
    editTitle: 'Redigera pizza',
    name: 'Namn',
    namePlaceholder: 't.ex. Diavola',
    description: 'Beskrivning',
    descriptionPlaceholder: 'Vad gör den här pizzan speciell?',
    ingredients: 'Ingredienser',
    perPizza: 'per pizza',
    ingredient: 'Ingrediens',
    amount: 'Mängd',
    unit: 'Enhet',
    addIngredient: 'Lägg till ingrediens',
    removeIngredient: 'Ta bort ingrediens',
    cancel: 'Avbryt',
    save: 'Spara',
    delete: 'Ta bort pizza',
    confirmDelete: 'Ta bort den här pizzan?',
    close: 'Stäng',
    needName: 'Ge pizzan ett namn',
    needIngredient: 'Lägg till minst en ingrediens',
    photo: 'Foto',
    addPhoto: 'Lägg till foto',
    changePhoto: 'Byt foto',
    removePhoto: 'Ta bort foto',
    photoSignIn: 'Logga in för att lägga till ett foto',
    preparingPhoto: 'Förbereder foto…',
    saving: 'Sparar…',
    photoFailed: 'Kunde inte läsa bilden — prova en annan (JPG, PNG eller WebP).',
    saveFailed: 'Kunde inte spara. Kontrollera anslutningen och försök igen.',
    share: 'Dela med communityn',
    shareHint: (nick: string) => `Andra kan se, betygsätta och kopiera den. Visas som ${nick}.`,
    nickname: 'Välj ett smeknamn',
    nicknameHint: 'Visas med pizzor du delar — ditt Google-namn visas aldrig. Kan ändras under Konto.',
    nicknamePlaceholder: 't.ex. PizzaKim',
    nicknameInvalid: 'Smeknamnet måste vara 2–30 tecken.',
    nicknameTaken: 'Det smeknamnet är redan taget — prova ett annat.',
    shareNeedsPhoto: 'Lägg till ett foto för att kunna dela pizzan.',
  },
  en: {
    newTitle: 'New pizza',
    editTitle: 'Edit pizza',
    name: 'Name',
    namePlaceholder: 'e.g. Diavola',
    description: 'Description',
    descriptionPlaceholder: 'What makes this pizza special?',
    ingredients: 'Ingredients',
    perPizza: 'per pizza',
    ingredient: 'Ingredient',
    amount: 'Amount',
    unit: 'Unit',
    addIngredient: 'Add ingredient',
    removeIngredient: 'Remove ingredient',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete pizza',
    confirmDelete: 'Delete this pizza?',
    close: 'Close',
    needName: 'Give the pizza a name',
    needIngredient: 'Add at least one ingredient',
    photo: 'Photo',
    addPhoto: 'Add photo',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    photoSignIn: 'Sign in to add a photo',
    preparingPhoto: 'Preparing photo…',
    saving: 'Saving…',
    photoFailed: "Couldn't read that image — try another one (JPG, PNG or WebP).",
    saveFailed: "Couldn't save. Check your connection and try again.",
    share: 'Share with the community',
    shareHint: (nick: string) => `Others can see, rate and copy it. Shown as ${nick}.`,
    nickname: 'Choose a nickname',
    nicknameHint: 'Shown with pizzas you share — your Google name is never shown. You can change it under Account.',
    nicknamePlaceholder: 'e.g. PizzaKim',
    nicknameInvalid: 'Nicknames must be 2–30 characters.',
    nicknameTaken: 'That nickname is taken — try another one.',
    shareNeedsPhoto: 'Add a photo to share this pizza.',
  },
} as const;

const labelText = 'block font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft dark:text-char-400';
const inputClass =
  'w-full rounded-md border border-paper-400 bg-white/60 px-3 py-2.5 text-ink outline-none transition-shadow placeholder:text-ink-muted/70 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60 dark:text-char-100 dark:placeholder:text-char-400/70';

interface Row {
  key: string;
  name: string;
  amount: string;
  /** A UnitCode, or CUSTOM_UNIT for an old free-text unit. */
  unit: string;
  customUnit?: LocalizedText;
  /** The original ingredient, so the other language survives an edit. */
  source?: PizzaIngredient;
}

/**
 * Users edit one language at a time. If the other language was a mirror of this
 * one (or empty), keep mirroring; otherwise leave the other translation alone.
 */
const updateLocalized = (old: LocalizedText | undefined, lang: Lang, text: string): LocalizedText => {
  const other: Lang = lang === 'sv' ? 'en' : 'sv';
  if (!old) return { sv: text, en: text };
  const mirrored = !old[other] || old[other] === old[lang];
  return { ...old, [lang]: text, [other]: mirrored ? text : old[other] } as LocalizedText;
};

let rowCounter = 0;
const rowKey = () => `r${++rowCounter}`;

const toRows = (pizza: PartyPizza | null, lang: Lang): Row[] =>
  pizza && pizza.ingredients.length > 0
    ? pizza.ingredients.map((original) => {
        // Known names/units are shown translated, even if the pizza was written in the other language.
        const i = localizeIngredient(original);
        const code = unitCode(i.unit);
        return {
          key: rowKey(),
          name: i.name[lang],
          amount: String(i.amount),
          unit: code ?? CUSTOM_UNIT,
          ...(code ? {} : { customUnit: i.unit }),
          source: i,
        };
      })
    : [{ key: rowKey(), name: '', amount: '', unit: 'g' }];

interface PizzaEditorProps {
  /** The pizza to edit, or null to create a new one. */
  pizza: PartyPizza | null;
  lang: Lang;
  /** Resolves false when saving failed, so the editor stays open. */
  onSave: (pizza: PartyPizza, photo: PhotoChange) => Promise<boolean> | void;
  onDelete?: () => void;
  onClose: () => void;
  /** Photos need an account (they live in Supabase Storage). */
  photoEnabled?: boolean;
  onSignIn?: () => void;
}

const PizzaEditor: React.FC<PizzaEditorProps> = ({
  pizza,
  lang,
  onSave,
  onDelete,
  onClose,
  photoEnabled = false,
  onSignIn,
}) => {
  const t = T[lang];
  const [name, setName] = useState(pizza?.name ?? '');
  const [description, setDescription] = useState(pizza?.description[lang] ?? '');
  const [rows, setRows] = useState<Row[]>(() => toRows(pizza, lang));
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PhotoChange>({ kind: 'keep' });
  const [share, setShare] = useState(!!pizza?.isPublic);
  const { profile, updateProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const needsNickname = photoEnabled && !profile?.nickname;
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Free the object URL of a replaced or abandoned preview.
  useEffect(
    () => () => {
      if (newPreview) URL.revokeObjectURL(newPreview);
    },
    [newPreview],
  );

  const previewSrc =
    photo.kind === 'new' ? newPreview : photo.kind === 'keep' ? photoUrl(pizza?.imagePath) : undefined;

  const handlePickPhoto = async (file: File) => {
    setPreparing(true);
    setError(null);
    try {
      const image = await prepareImage(file);
      setPhoto({ kind: 'new', image });
      setNewPreview(URL.createObjectURL(image.blob));
    } catch (err) {
      console.error(err);
      setError(t.photoFailed);
    } finally {
      setPreparing(false);
    }
  };
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Mount-only: focus the name, close on Escape, lock page scroll behind the sheet.
  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || preparing) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t.needName);
      nameRef.current?.focus();
      return;
    }
    const ingredients: PizzaIngredient[] = rows
      .filter((r) => r.name.trim())
      .map((r) => {
        const amount = parseFloat(r.amount.replace(',', '.'));
        const text = r.name.trim();
        // Catalog names are saved in both languages; anything else stays as typed.
        const name =
          findIngredient(text) ??
          (r.source && text === r.source.name[lang] ? r.source.name : updateLocalized(r.source?.name, lang, text));
        const unit =
          r.unit === CUSTOM_UNIT ? r.customUnit ?? { sv: '', en: '' } : canonicalUnit(r.unit as UnitCode);
        return {
          ...(r.source?.note ? { note: r.source.note } : {}),
          name,
          amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
          unit,
        };
      });
    if (ingredients.length === 0) {
      setError(t.needIngredient);
      return;
    }
    setSaving(true);
    // First share: save the chosen nickname before the pizza (the database requires it).
    if (share && previewSrc && needsNickname) {
      const res = validNickname(nickname) ? await updateProfile({ nickname }) : 'invalid';
      if (res !== 'ok') {
        setSaving(false);
        setError(res === 'taken' ? t.nicknameTaken : res === 'invalid' ? t.nicknameInvalid : t.saveFailed);
        return;
      }
    }
    const ok = await onSave(
      {
        id: pizza?.id ?? newPizzaId(),
        name: trimmedName,
        description: updateLocalized(pizza?.description, lang, description.trim()),
        ingredients,
        ...(pizza?.imagePath ? { imagePath: pizza.imagePath } : {}),
        ...(share && previewSrc ? { isPublic: true } : {}),
      },
      photo,
    );
    // On success the parent closes the editor; on failure stay open with the edits intact.
    if (ok === false) {
      setSaving(false);
      setError(t.saveFailed);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pizza-editor-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 bg-char-950/60 backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-xl border border-paper-300 bg-paper-50 text-ink shadow-xl sm:m-4 sm:max-w-xl sm:rounded-lg dark:border-char-600 dark:bg-char-800 dark:text-char-100"
      >
        <div className="flex items-center justify-between gap-4 border-b border-dashed border-paper-400 px-5 pb-4 pt-5 sm:px-6 dark:border-char-500">
          <h2 id="pizza-editor-title" className="font-display text-xl font-bold sm:text-2xl">
            {pizza ? t.editTitle : t.newTitle}
          </h2>
          <button
            type="button"
            aria-label={t.close}
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-paper-100 active:bg-paper-200 dark:hover:bg-char-700 dark:active:bg-char-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <div>
            <span className={`mb-2 ${labelText}`}>{t.photo}</span>
            {photoEnabled ? (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={preparing || saving}
                  aria-label={previewSrc ? t.changePhoto : t.addPhoto}
                  className="relative flex aspect-[3/2] w-36 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-paper-400 bg-paper-100 text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-700 sm:w-44 dark:border-char-500 dark:bg-char-900/60 dark:text-char-400 dark:hover:border-brand-400 dark:hover:text-brand-300"
                >
                  {previewSrc ? (
                    <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-7 w-7" aria-hidden="true" />
                  )}
                  {preparing && (
                    <span className="absolute inset-0 flex items-center justify-center bg-paper-50/70 dark:bg-char-900/70">
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    </span>
                  )}
                </button>
                <div className="flex flex-col items-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={preparing || saving}
                    className="inline-flex items-center gap-1.5 rounded-full border border-paper-400 px-3 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-soft transition-all hover:border-brand-400 hover:text-brand-700 disabled:opacity-50 dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300"
                  >
                    <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                    {preparing ? t.preparingPhoto : previewSrc ? t.changePhoto : t.addPhoto}
                  </button>
                  {previewSrc && !preparing && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto({ kind: 'remove' });
                        setNewPreview(null);
                        setShare(false);
                      }}
                      disabled={saving}
                      className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-brand-700 dark:text-char-400 dark:hover:text-brand-300"
                    >
                      {t.removePhoto}
                    </button>
                  )}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePickPhoto(file);
                    e.target.value = '';
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="flex w-full items-center gap-3 rounded-md border border-dashed border-paper-400 px-4 py-3 text-left font-display text-sm italic text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-char-500 dark:text-char-400 dark:hover:border-brand-400 dark:hover:text-brand-300"
              >
                <ImagePlus className="h-5 w-5 shrink-0" aria-hidden="true" />
                {t.photoSignIn}
              </button>
            )}
          </div>

          {photoEnabled && (
            <div className="rounded-md border border-dashed border-paper-400 px-4 py-3 dark:border-char-500">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-ink dark:text-char-100">{t.share}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={share && !!previewSrc}
                  aria-label={t.share}
                  disabled={!previewSrc || saving}
                  onClick={() => setShare((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40 ${
                    share && previewSrc ? 'bg-brand-600 dark:bg-brand-400' : 'bg-paper-400 dark:bg-char-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      share && previewSrc ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="mt-1 font-display text-sm italic text-ink-muted dark:text-char-400">
                {!previewSrc ? t.shareNeedsPhoto : profile?.nickname ? t.shareHint(profile.nickname) : t.nicknameHint}
              </p>
              {share && previewSrc && needsNickname && (
                <div className="mt-3">
                  <label htmlFor="share-nickname" className={`mb-1.5 ${labelText}`}>
                    {t.nickname}
                  </label>
                  <input
                    id="share-nickname"
                    value={nickname}
                    maxLength={30}
                    placeholder={t.nicknamePlaceholder}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setError(null);
                    }}
                    className={`${inputClass} font-display font-bold`}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="pizza-name" className={`mb-2 ${labelText}`}>
              {t.name}
            </label>
            <input
              id="pizza-name"
              ref={nameRef}
              value={name}
              maxLength={60}
              placeholder={t.namePlaceholder}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className={`${inputClass} font-display text-lg font-bold`}
            />
          </div>

          <div>
            <label htmlFor="pizza-description" className={`mb-2 ${labelText}`}>
              {t.description}
            </label>
            <textarea
              id="pizza-description"
              value={description}
              rows={2}
              maxLength={240}
              placeholder={t.descriptionPlaceholder}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none font-display italic`}
            />
          </div>

          <fieldset>
            <legend className="mb-2 flex w-full items-baseline justify-between">
              <span className={labelText}>{t.ingredients}</span>
              <span className="font-display text-sm italic text-ink-muted dark:text-char-400/80">{t.perPizza}</span>
            </legend>
            <datalist id="ingredient-suggestions">
              {ingredientSuggestions(lang).map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={row.key} className="grid grid-cols-[1fr_2.75rem_5rem_1.75rem] items-center gap-1.5 sm:grid-cols-[1fr_4.5rem_5.5rem_2rem] sm:gap-2">
                  <input
                    aria-label={`${t.ingredient} ${i + 1}`}
                    value={row.name}
                    list="ingredient-suggestions"
                    autoComplete="off"
                    placeholder={t.ingredient}
                    onChange={(e) => {
                      updateRow(row.key, { name: e.target.value });
                      setError(null);
                    }}
                    className={`${inputClass} min-w-0 px-2.5 text-sm`}
                  />
                  <input
                    aria-label={`${t.amount} ${i + 1}`}
                    value={row.amount}
                    inputMode="decimal"
                    placeholder="0"
                    onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                    className={`${inputClass} px-2 text-right font-mono text-sm tabular-nums`}
                  />
                  <select
                    aria-label={`${t.unit} ${i + 1}`}
                    value={row.unit}
                    onChange={(e) => updateRow(row.key, { unit: e.target.value })}
                    className={`${inputClass.replace('px-3 ', '')} pl-1.5 pr-0.5 font-mono text-xs`}
                  >
                    {UNIT_CODES.map((code) => (
                      <option key={code} value={code}>
                        {UNITS[code][lang][1]}
                      </option>
                    ))}
                    {row.customUnit && <option value={CUSTOM_UNIT}>{row.customUnit[lang] || '—'}</option>}
                  </select>
                  <button
                    type="button"
                    aria-label={t.removeIngredient}
                    disabled={rows.length === 1}
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-paper-100 hover:text-brand-700 disabled:opacity-30 disabled:hover:bg-transparent dark:text-char-400 dark:hover:bg-char-700 dark:hover:text-brand-300"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setRows((prev) => {
                  const last = prev[prev.length - 1]?.unit;
                  return [...prev, { key: rowKey(), name: '', amount: '', unit: last && last !== CUSTOM_UNIT ? last : 'g' }];
                })
              }
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-paper-400 px-3 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-soft transition-all hover:border-brand-400 hover:text-brand-700 active:scale-[0.97] dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t.addIngredient}
            </button>
          </fieldset>

          {error && (
            <p role="alert" className="font-display text-sm italic text-brand-700 dark:text-brand-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-paper-400 px-5 py-4 sm:px-6 dark:border-char-500">
          {onDelete ? (
            <button
              type="button"
              onClick={() => window.confirm(t.confirmDelete) && onDelete()}
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-brand-700 dark:text-char-400 dark:hover:text-brand-300"
            >
              {t.delete}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-paper-400 px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink-soft transition-all hover:border-brand-400 hover:text-brand-700 dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving || preparing}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 disabled:opacity-60 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-50 transition-colors hover:bg-brand-700 dark:bg-char-100 dark:text-char-900 dark:hover:bg-brand-300"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {saving ? t.saving : t.save}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PizzaEditor;
