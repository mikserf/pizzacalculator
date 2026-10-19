import React, { useState, useEffect, useRef } from 'react';
import { PartyPizza, PizzaId, SelectedPizza, Lang } from '../types/party';
import {
  Plus,
  Minus,
  Trash2,
  ChefHat,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  ShoppingCart,
  Check,
  Info,
  Pencil,
  Copy,
  Upload,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Link } from 'react-router-dom';
import PizzaEditor, { PhotoChange } from './PizzaEditor';
import { deletePhoto, photoUrl, uploadPhoto } from '../lib/photos';
import { imageToJpegDataUrl } from '../lib/image';
import { usePizzaStore, isMyPizza, isValidPizza, newPizzaId } from '../hooks/usePizzaStore';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../hooks/useLang';

interface IngredientTotal {
  name: string;
  amount: number;
  unit: string;
  note?: string;
}

/** Format a number so 2.0 becomes "2" and 1.5 stays "1.5". */
const formatAmount = (n: number): string => {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

/** Stable key for an ingredient row (localized name + unit). */
const ingKey = (name: string, unit: string) => `${name}||${unit}`;

/* ------------------------------------------------------------------ */
/* Shared styles (mirror CalculatorControls)                           */
/* ------------------------------------------------------------------ */

const labelText = 'font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink-soft dark:text-char-400';
const cardClass =
  'rounded-lg border border-paper-300 bg-paper-50 shadow-[0_1px_0_rgba(60,40,20,0.04),0_10px_24px_-14px_rgba(60,40,20,0.22)] dark:border-char-600 dark:bg-char-800 dark:shadow-none';
const cardHeader =
  'flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-paper-400 px-5 pb-4 pt-5 sm:px-6 dark:border-char-500';
const itemClass = 'rounded-md border border-paper-400 bg-white/50 p-3 dark:border-char-500 dark:bg-char-900/40';
const pillOutline =
  'inline-flex items-center gap-1.5 rounded-full border border-paper-400 px-3 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-soft transition-all hover:border-brand-400 hover:text-brand-700 active:scale-[0.97] dark:border-char-500 dark:text-char-300 dark:hover:border-brand-400 dark:hover:text-brand-300';
const pillSolid =
  'inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-50 transition-colors hover:bg-brand-700 active:scale-[0.97] dark:bg-char-100 dark:text-char-900 dark:hover:bg-brand-300';
const disclosureBtn =
  'mt-2 flex items-center gap-1 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-brand-700 dark:text-char-400 dark:hover:text-brand-300';
const iconBtn =
  'inline-flex h-8 w-8 items-center justify-center text-brand-600 transition-colors hover:bg-paper-100 active:bg-paper-200 dark:text-brand-300 dark:hover:bg-char-700 dark:active:bg-char-600';

const roundIconBtn =
  'inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-paper-100 hover:text-brand-700 dark:text-char-400 dark:hover:bg-char-700 dark:hover:text-brand-300';

const IngredientRow = ({
  ing,
  have,
  onToggle,
  ariaLabel,
}: {
  ing: IngredientTotal;
  have: boolean;
  onToggle: () => void;
  ariaLabel: string;
}) => (
  <li className="flex items-center gap-3 py-2.5">
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={have}
      aria-label={ariaLabel}
      className={[
        'flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors',
        have
          ? 'border-ink bg-ink text-paper-50 dark:border-char-100 dark:bg-char-100 dark:text-char-900'
          : 'border-paper-400 text-transparent hover:border-brand-400 dark:border-char-500 dark:hover:border-brand-400',
      ].join(' ')}
    >
      <Check className="h-4 w-4" strokeWidth={3} />
    </button>
    <div className="min-w-0 flex-1">
      <p
        className={[
          'truncate font-medium',
          have ? 'text-ink-muted line-through dark:text-char-400' : 'text-ink dark:text-char-100',
        ].join(' ')}
      >
        {ing.name}
      </p>
      {ing.note && <p className="font-display text-xs italic text-ink-muted dark:text-char-400">({ing.note})</p>}
    </div>
    <p
      className={[
        'shrink-0 font-mono text-sm font-semibold tabular-nums',
        have ? 'text-ink-muted dark:text-char-400' : 'text-brand-700 dark:text-brand-300',
      ].join(' ')}
    >
      {formatAmount(ing.amount)} {ing.unit}
    </p>
  </li>
);

/** All user-facing strings, keyed by language. */
const UI = {
  sv: {
    title: 'Party Mode',
    subtitle: 'Nu planerar vi menyn för din fest.',
    available: 'Tillgängliga pizzor',
    add: 'Lägg till',
    ingredients: (n: number) => `Ingredienser (${n})`,
    selected: 'Valda pizzor',
    total: (n: number) => `${n} totalt`,
    clearAll: 'Rensa alla',
    empty: 'Inga pizzor valda ännu',
    emptyHint: 'Välj pizzor till vänster för att komma igång',
    ingredientsFor: (n: number) => `Ingredienser för ${n} ${n === 1 ? 'pizza' : 'pizzor'}`,
    pizzaCount: (n: number) => `${n} ${n === 1 ? 'pizza' : 'pizzor'}`,
    exportPreview: 'Exportera & förhandsgranska',
    downloadPdf: 'Ladda ner PDF',
    eventMenu: 'Evenemangsmeny',
    shoppingList: 'Inköpslista',
    loading: 'Laddar pizzor...',
    menuSub: 'Ristorante · Pizzeria Napoletana',
    buonAppetito: 'Smaklig måltid!',
    shoppingSub: 'Ingredienser för pizzafest',
    totalPizzas: 'Totalt antal pizzor',
    pizzaTypes: 'Pizzasorter',
    ingredientsCount: 'Ingredienser',
    ingredientsNeeded: 'Ingredienser som behövs',
    pdfMenuTitle: 'PIZZAFEST',
    pdfMenuSection: 'MENYN',
    pdfMenuThanks: 'Tack för att ni valde oss',
    pdfUniqueIngredients: 'Unika ingredienser',
    needToBuy: 'Behöver köpas',
    whatIHave: 'Det jag har',
    toBuy: 'Att köpa',
    nothingToBuy: 'Allt klart — inget att köpa',
    markHave: 'Markera som har',
    markBuy: 'Markera som att köpa',
    haveHint: 'Klicka på det du redan har hemma',
    clearHave: 'Rensa markeringar',
    pdfHappy: 'Trevlig shopping!',
    myPizzas: 'Mina pizzor',
    houseMenu: 'Husets meny',
    newPizza: 'Ny pizza',
    myEmpty: 'Skapa egna pizzor eller kopiera en från husets meny och gör den till din.',
    edit: 'Redigera',
    copyToMine: 'Kopiera till mina pizzor',
    copyName: (n: string) => `${n} (kopia)`,
    shared: 'Delad',
    exportMine: 'Exportera',
    importMine: 'Importera',
    imported: (n: number) => `${n} ${n === 1 ? 'pizza importerad' : 'pizzor importerade'}`,
    importFailed: 'Kunde inte läsa filen — välj en exporterad pizzafil (.json)',
    savedCloud: 'Sparas på ditt konto',
    savedDevice: 'Sparas bara på den här enheten.',
    signInToSync: 'Logga in för att ha dem överallt',
    uploadPrompt: (n: number) =>
      `Du har ${n} ${n === 1 ? 'pizza' : 'pizzor'} sparade på den här enheten. Flytta dem till ditt konto?`,
    upload: 'Flytta till kontot',
    notNow: 'Inte nu',
    storeErrors: {
      load: 'Kunde inte hämta dina pizzor. Ladda om sidan och försök igen.',
      save: 'Kunde inte spara pizzan. Kontrollera anslutningen och försök igen.',
      delete: 'Kunde inte ta bort pizzan. Försök igen.',
      upload: 'Kunde inte flytta pizzorna till kontot. Försök igen.',
    },
    dismiss: 'Stäng',
  },
  en: {
    title: 'Party Mode',
    subtitle: "Let's plan the menu for your party.",
    available: 'Available Pizzas',
    add: 'Add',
    ingredients: (n: number) => `Ingredients (${n})`,
    selected: 'Selected Pizzas',
    total: (n: number) => `${n} total`,
    clearAll: 'Clear All',
    empty: 'No pizzas selected yet',
    emptyHint: 'Choose pizzas from the left to get started',
    ingredientsFor: (n: number) => `Ingredients for ${n} ${n === 1 ? 'pizza' : 'pizzas'}`,
    pizzaCount: (n: number) => `${n} ${n === 1 ? 'pizza' : 'pizzas'}`,
    exportPreview: 'Export & Preview',
    downloadPdf: 'Download PDF',
    eventMenu: 'Event Menu',
    shoppingList: 'Shopping List',
    loading: 'Loading pizzas...',
    menuSub: 'Ristorante · Pizzeria Napoletana',
    buonAppetito: 'Buon Appetito!',
    shoppingSub: 'Pizza Party Ingredients',
    totalPizzas: 'Total Pizzas',
    pizzaTypes: 'Pizza Types',
    ingredientsCount: 'Ingredients',
    ingredientsNeeded: 'Ingredients Needed',
    pdfMenuTitle: 'PIZZA PARTY',
    pdfMenuSection: 'THE MENU',
    pdfMenuThanks: 'Grazie per averci scelto',
    pdfUniqueIngredients: 'Unique Ingredients',
    needToBuy: 'Need to buy',
    whatIHave: 'What I have',
    toBuy: 'To buy',
    nothingToBuy: 'All set — nothing to buy',
    markHave: 'Mark as have',
    markBuy: 'Mark as to buy',
    haveHint: 'Click the items you already have at home',
    clearHave: 'Clear marks',
    pdfHappy: 'Happy Shopping!',
    myPizzas: 'My pizzas',
    houseMenu: 'House menu',
    newPizza: 'New pizza',
    myEmpty: 'Create your own pizzas, or copy one from the house menu and make it yours.',
    edit: 'Edit',
    copyToMine: 'Copy to my pizzas',
    copyName: (n: string) => `${n} (copy)`,
    shared: 'Shared',
    exportMine: 'Export',
    importMine: 'Import',
    imported: (n: number) => `${n} ${n === 1 ? 'pizza imported' : 'pizzas imported'}`,
    importFailed: "Couldn't read that file — choose an exported pizza file (.json)",
    savedCloud: 'Saved to your account',
    savedDevice: 'Saved on this device only.',
    signInToSync: 'Sign in to keep them everywhere',
    uploadPrompt: (n: number) =>
      `You have ${n} ${n === 1 ? 'pizza' : 'pizzas'} saved on this device. Move ${n === 1 ? 'it' : 'them'} to your account?`,
    upload: 'Move to account',
    notNow: 'Not now',
    storeErrors: {
      load: "Couldn't load your pizzas. Reload the page and try again.",
      save: "Couldn't save the pizza. Check your connection and try again.",
      delete: "Couldn't delete the pizza. Try again.",
      upload: "Couldn't move the pizzas to your account. Try again.",
    },
    dismiss: 'Dismiss',
  },
} as const;

/** Aggregate ingredients across the selected pizzas, sorted by name (localized). */
const getIngredientTotals = (items: SelectedPizza[], lang: Lang): IngredientTotal[] => {
  const map = new Map<string, IngredientTotal>();
  items.forEach((pizza) => {
    pizza.ingredients.forEach((ing) => {
      const name = ing.name[lang];
      const unit = ing.unit[lang];
      const key = `${name}||${unit}`;
      const existing = map.get(key);
      if (existing) {
        existing.amount += ing.amount * pizza.quantity;
      } else {
        map.set(key, {
          name,
          amount: ing.amount * pizza.quantity,
          unit,
          note: ing.note ? ing.note[lang] : undefined,
        });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const PartyMode: React.FC = () => {
  const {
    house,
    mine,
    all: pizzas,
    loading,
    cloud,
    localOnly,
    error: storeError,
    clearError,
    savePizza,
    removePizza,
    importPizzas,
    uploadLocal,
  } = usePizzaStore();
  const auth = useAuth();
  const [uploadDismissed, setUploadDismissed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPizzas, setSelectedPizzas] = useState<SelectedPizza[]>([]);
  const [expandedAvailable, setExpandedAvailable] = useState<Record<string, boolean>>({});
  const [expandedSelected, setExpandedSelected] = useState<Record<string, boolean>>({});
  /** undefined = closed, null = creating a new pizza, otherwise the pizza being edited. */
  const [editing, setEditing] = useState<PartyPizza | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [previewTab, setPreviewTab] = useState<'menu' | 'shopping'>('menu');
  const lang = useLang();
  const hydrated = useRef(false);
  const [haveIngredients, setHaveIngredients] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('haveIngredients');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('haveIngredients', JSON.stringify(haveIngredients));
  }, [haveIngredients]);

  const toggleHave = (key: string) => {
    setHaveIngredients((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // Hydrate selected pizzas from localStorage once the house menu has loaded
  useEffect(() => {
    if (loading || hydrated.current) return;
    const savedSelectedPizzas = localStorage.getItem('selectedPizzas');
    if (savedSelectedPizzas) {
      try {
        const parsedPizzas = JSON.parse(savedSelectedPizzas);
        const hydratedPizzas = parsedPizzas
          .map((saved: { id: PizzaId; quantity: number }) => {
            const full = pizzas.find((p) => p.id === saved.id);
            if (full) return { ...full, quantity: saved.quantity };
            // Community pizzas aren't in your own list — keep the saved copy.
            return isValidPizza(saved) ? saved : null;
          })
          .filter(Boolean);
        setSelectedPizzas(hydratedPizzas);
        hydrated.current = true;
      } catch (error) {
        console.error('Error parsing saved pizzas:', error);
        hydrated.current = true;
      }
    } else {
      hydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Save selected pizzas to localStorage whenever they change (after hydration)
  useEffect(() => {
    if (!hydrated.current) return;
    if (selectedPizzas.length > 0) {
      localStorage.setItem('selectedPizzas', JSON.stringify(selectedPizzas));
    } else {
      localStorage.removeItem('selectedPizzas');
    }
  }, [selectedPizzas]);

  const toggleAvailable = (id: PizzaId) =>
    setExpandedAvailable((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleSelected = (id: PizzaId) =>
    setExpandedSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((n) => (n === message ? null : n)), 3500);
  };

  // ------------------------------------------------------------- My pizzas
  const handleSavePizza = async (pizza: PartyPizza, photo: PhotoChange): Promise<boolean> => {
    const userId = auth.user?.id;
    let next = pizza;
    let uploaded: string | undefined;
    // Upload first, save the row, and only then drop the old file — a failed
    // save never leaves the pizza pointing at a missing photo.
    if (photo.kind === 'new' && userId) {
      try {
        uploaded = await uploadPhoto(userId, String(pizza.id), photo.image);
      } catch (err) {
        console.error('Error uploading photo:', err);
        return false;
      }
      next = { ...pizza, imagePath: uploaded };
    } else if (photo.kind === 'remove') {
      next = { ...pizza };
      delete next.imagePath;
    }

    const ok = await savePizza(next);
    if (!ok) {
      if (uploaded && userId) deletePhoto(userId, uploaded);
      return false;
    }
    if (photo.kind !== 'keep' && pizza.imagePath && userId) deletePhoto(userId, pizza.imagePath);

    // Keep any selected copy in sync with the edit.
    setSelectedPizzas((prev) => prev.map((p) => (p.id === next.id ? { ...next, quantity: p.quantity } : p)));
    setEditing(undefined);
    return true;
  };

  const handleDeletePizza = (id: PizzaId) => {
    removePizza(id);
    removePizzaFromSelection(id);
    setEditing(undefined);
  };

  const copyToMine = (pizza: PartyPizza) => {
    const u = UI[lang];
    const copy: PartyPizza = { ...pizza, id: newPizzaId(), name: u.copyName(pizza.name) };
    delete copy.imagePath; // never share a stored file between two pizzas
    savePizza(copy);
    setEditing(copy);
  };

  const exportMyPizzas = () => {
    const blob = new Blob([JSON.stringify({ pizzas: mine }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-pizzas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const u = UI[lang];
    try {
      const count = importPizzas(JSON.parse(await file.text()));
      flash(count > 0 ? u.imported(count) : u.importFailed);
    } catch {
      flash(u.importFailed);
    }
  };

  const addPizzaToSelection = (pizza: PartyPizza) => {
    setSelectedPizzas((prev) => {
      const existing = prev.find((p) => p.id === pizza.id);
      if (existing) {
        return prev.map((p) => (p.id === pizza.id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [...prev, { ...pizza, quantity: 1 }];
    });
  };

  const updatePizzaQuantity = (pizzaId: PizzaId, quantity: number) => {
    if (quantity <= 0) {
      removePizzaFromSelection(pizzaId);
      return;
    }
    setSelectedPizzas((prev) => prev.map((p) => (p.id === pizzaId ? { ...p, quantity } : p)));
  };

  const removePizzaFromSelection = (pizzaId: PizzaId) => {
    setSelectedPizzas((prev) => prev.filter((p) => p.id !== pizzaId));
  };

  const clearAllSelections = () => {
    setSelectedPizzas([]);
    localStorage.removeItem('selectedPizzas');
  };

  const getTotalPizzas = () => selectedPizzas.reduce((total, pizza) => total + pizza.quantity, 0);

  // ---------------------------------------------------------------------------
  // PDF generation (native vector text, no screenshots)
  // ---------------------------------------------------------------------------
  const downloadMenuPDF = async (pdfLang: Lang) => {
    const u = UI[pdfLang];
    // Photos are fetched up front (as 3:2 JPEGs) so the layout pass stays synchronous.
    const photos = new Map<PizzaId, string>();
    await Promise.all(
      selectedPizzas.map(async (pizza) => {
        const url = photoUrl(pizza.imagePath);
        const data = url ? await imageToJpegDataUrl(url) : null;
        if (data) photos.set(pizza.id, data);
      }),
    );
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = pageW - margin * 2;
    const bottom = pageH - margin;

    // Warm, trattoria-style palette
    const INK: [number, number, number] = [52, 44, 38];
    const ACCENT: [number, number, number] = [178, 82, 45];
    const MUTED: [number, number, number] = [124, 112, 102];
    const SOFT: [number, number, number] = [188, 168, 150];
    const RULE: [number, number, number] = [218, 202, 186];

    let y = margin + 4;

    const ensureSpace = (h: number) => {
      if (y + h > bottom) {
        pdf.addPage();
        y = margin + 6;
      }
    };

    // Letterspaced, centered single line (manual centering so charSpace is accurate)
    const centeredSpaced = (
      text: string,
      baseline: number,
      size: number,
      style: string,
      color: [number, number, number],
      charSpace = 0,
    ) => {
      pdf.setFont('times', style);
      pdf.setFontSize(size);
      pdf.setTextColor(color[0], color[1], color[2]);
      const w = pdf.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
      const x = (pageW - w) / 2;
      if (charSpace > 0) {
        pdf.text(text, x, baseline, { charSpace });
      } else {
        pdf.text(text, x, baseline);
      }
    };

    // Ornamental rule: thin lines with a small diamond at the center
    const drawOrnament = (cy: number) => {
      const r = 1.5;
      const gap = 5;
      pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
      pdf.setLineWidth(0.4);
      pdf.line(margin, cy, pageW / 2 - gap - r, cy);
      pdf.line(pageW / 2 + gap + r, cy, pageW - margin, cy);
      pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      pdf.triangle(pageW / 2, cy - r, pageW / 2 - r, cy, pageW / 2, cy + r, 'F');
      pdf.triangle(pageW / 2, cy - r, pageW / 2 + r, cy, pageW / 2, cy + r, 'F');
    };

    // Short centered dotted divider between dishes
    const drawDottedDivider = (cy: number, width = 44) => {
      const x1 = (pageW - width) / 2;
      const x2 = (pageW + width) / 2;
      pdf.setFillColor(SOFT[0], SOFT[1], SOFT[2]);
      const spacing = 2;
      for (let x = x1; x <= x2 + 0.01; x += spacing) {
        pdf.circle(x, cy, 0.28, 'F');
      }
    };

    // ---------------------------------------------------------------- Header
    centeredSpaced(u.pdfMenuTitle, y + 10, 32, 'bold', ACCENT, 1.6);
    y += 18;
    centeredSpaced(u.menuSub, y, 11, 'italic', MUTED, 0.3);
    y += 14;
    drawOrnament(y);
    y += 11;
    centeredSpaced(u.pdfMenuSection, y, 12, 'bold', INK, 3);
    y += 18;

    // ----------------------------------------------------------------- Items
    selectedPizzas.forEach((pizza, idx) => {
      // If a pizza has a real name (not just "No{id}"), use it as the title.
      // User-created pizzas have UUID ids, so they get no "N°" line.
      const numbered = !isMyPizza(pizza);
      const defaultName = `no${pizza.id}`;
      const title = pizza.name.trim().toLowerCase() !== defaultName ? pizza.name : undefined;
      const description = pizza.description[pdfLang].trim();

      const paragraphs: Array<{
        text: string;
        size: number;
        style: string;
        color: [number, number, number];
        lh: number;
        maxW: number;
      }> = [];

      if (title) {
        paragraphs.push({ text: title, size: 14, style: 'bold', color: INK, lh: 6, maxW: contentW - 8 });
        if (description) {
          paragraphs.push({ text: description, size: 11, style: 'italic', color: MUTED, lh: 4.8, maxW: contentW - 12 });
        }
      } else {
        paragraphs.push({ text: description, size: 12.5, style: 'italic', color: INK, lh: 5.4, maxW: contentW - 8 });
      }

      const ingText = pizza.ingredients.map((i) => i.name[pdfLang]).join(' · ');
      paragraphs.push({ text: ingText, size: 9.5, style: 'normal', color: MUTED, lh: 4.2, maxW: contentW - 24 });

      // Measure wrapped lines so we know the exact block height
      const measured = paragraphs.map((p) => {
        pdf.setFont('times', p.style);
        pdf.setFontSize(p.size);
        return { ...p, lines: pdf.splitTextToSize(p.text, p.maxW) as string[] };
      });

      const photo = photos.get(pizza.id);
      const photoW = 66;
      const photoH = photo ? photoW / 1.5 + 6 : 0;
      const numberH = numbered ? 13 : 5;
      const dividerH = idx < selectedPizzas.length - 1 ? 12 : 0;
      const bodyH = measured.reduce((sum, p) => sum + p.lines.length * p.lh, 0);
      const gapH = measured.length * 7;
      const blockH = photoH + numberH + bodyH + gapH + dividerH;

      ensureSpace(blockH);

      // Photo
      if (photo) {
        const px = (pageW - photoW) / 2;
        pdf.addImage(photo, 'JPEG', px, y, photoW, photoW / 1.5);
        pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
        pdf.setLineWidth(0.3);
        pdf.rect(px, y, photoW, photoW / 1.5, 'S');
        y += photoH;
      }

      // Number
      if (numbered) centeredSpaced(`N° ${pizza.id}`, y + 5, 15, 'bold', ACCENT, 1.4);
      y += numberH;

      // Paragraphs (title / description / ingredients)
      measured.forEach((p) => {
        p.lines.forEach((line, i) => {
          pdf.setFont('times', p.style);
          pdf.setFontSize(p.size);
          pdf.setTextColor(p.color[0], p.color[1], p.color[2]);
          pdf.text(line, pageW / 2, y + i * p.lh, { align: 'center' });
        });
        y += p.lines.length * p.lh + 7;
      });

      // Divider
      if (dividerH) {
        y += 4;
        drawDottedDivider(y);
        y += 8;
      }
    });

    // ----------------------------------------------------------------- Footer
    ensureSpace(40);
    y += 12;
    drawOrnament(y);
    y += 12;
    centeredSpaced(u.buonAppetito, y, 14, 'italic', ACCENT, 0.6);
    y += 9;
    centeredSpaced(u.pdfMenuThanks, y, 9, 'italic', MUTED, 0.3);

    pdf.save('pizza-menu.pdf');
  };

  const downloadShoppingListPDF = (pdfLang: Lang) => {
    const u = UI[pdfLang];
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = pageW - margin * 2;
    const bottom = pageH - margin;

    // Warm, trattoria-style palette (matches the menu PDF)
    const INK: [number, number, number] = [52, 44, 38];
    const ACCENT: [number, number, number] = [178, 82, 45];
    const MUTED: [number, number, number] = [124, 112, 102];
    const RULE: [number, number, number] = [218, 202, 186];

    let y = margin + 2;

    const ensureSpace = (h: number) => {
      if (y + h > bottom) {
        pdf.addPage();
        y = margin + 4;
      }
    };

    const spacedText = (
      text: string,
      cx: number,
      baseline: number,
      size: number,
      style: string,
      color: [number, number, number],
      charSpace = 0,
    ) => {
      pdf.setFont('times', style);
      pdf.setFontSize(size);
      pdf.setTextColor(color[0], color[1], color[2]);
      const w = pdf.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
      const x = cx - w / 2;
      if (charSpace > 0) {
        pdf.text(text, x, baseline, { charSpace });
      } else {
        pdf.text(text, x, baseline);
      }
    };

    const drawOrnament = (cy: number) => {
      const r = 1.4;
      const gap = 5;
      pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
      pdf.setLineWidth(0.4);
      pdf.line(margin, cy, pageW / 2 - gap - r, cy);
      pdf.line(pageW / 2 + gap + r, cy, pageW - margin, cy);
      pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      pdf.triangle(pageW / 2, cy - r, pageW / 2 - r, cy, pageW / 2, cy + r, 'F');
      pdf.triangle(pageW / 2, cy - r, pageW / 2 + r, cy, pageW / 2, cy + r, 'F');
    };

    const drawDots = (x1: number, x2: number, cy: number) => {
      pdf.setFillColor(RULE[0], RULE[1], RULE[2]);
      for (let x = x1; x <= x2; x += 2) {
        pdf.circle(x, cy, 0.22, 'F');
      }
    };

    const totals = getIngredientTotals(selectedPizzas, pdfLang);
    const needToBuy = totals.filter((ing) => !haveIngredients.includes(ingKey(ing.name, ing.unit)));
    const haveItems = totals.filter((ing) => haveIngredients.includes(ingKey(ing.name, ing.unit)));

    // ----------------------------------------------------------------- Header
    spacedText(u.shoppingList, pageW / 2, y + 9, 28, 'bold', ACCENT, 1.6);
    y += 15;
    spacedText(u.shoppingSub, pageW / 2, y, 11, 'italic', MUTED, 0.3);
    y += 12;
    drawOrnament(y);
    y += 10;

    // ---------------------------------------------------------- Summary strip
    const summary = [
      { label: u.totalPizzas, value: String(getTotalPizzas()) },
      { label: u.pizzaTypes, value: String(selectedPizzas.length) },
      { label: u.toBuy, value: String(needToBuy.length) },
    ];
    const boxW = contentW / 3;
    const boxH = 14;
    ensureSpace(boxH + 6);
    pdf.setFillColor(248, 244, 238);
    pdf.rect(margin, y, contentW, boxH, 'F');
    pdf.setDrawColor(RULE[0], RULE[1], RULE[2]);
    pdf.setLineWidth(0.3);
    pdf.line(margin + boxW, y + 3, margin + boxW, y + boxH - 3);
    pdf.line(margin + boxW * 2, y + 3, margin + boxW * 2, y + boxH - 3);

    summary.forEach((s, i) => {
      const cx = margin + boxW * i + boxW / 2;
      spacedText(s.label.toUpperCase(), cx, y + 5.5, 7, 'normal', MUTED, 1);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
      pdf.text(s.value, cx, y + 11.5, { align: 'center' });
    });
    y += boxH + 8;

    // ------------------------------------------------------ Two-column rows
    const colGap = 14;
    const midX = pageW / 2;
    const columns = [
      { checkX: margin, nameX: margin + 10, amountX: midX - colGap / 2 },
      { checkX: midX + colGap / 2, nameX: midX + colGap / 2 + 10, amountX: pageW - margin },
    ];

    const drawRow = (ing: IngredientTotal, col: (typeof columns)[number], checked: boolean) => {
      const nameW = col.amountX - col.nameX - 8;
      const nameLines = pdf.splitTextToSize(ing.name, nameW) as string[];
      const noteLine = ing.note ? `(${ing.note})` : null;
      const lh = 4.6;
      const rowH = Math.max(7, nameLines.length * lh + (noteLine ? 4 : 0) + 1.5);
      ensureSpace(rowH);

      const rowTop = y;
      const firstBaseline = rowTop + 4;

      // Checkbox
      const cbSize = 3;
      const cbY = rowTop + 1;
      if (checked) {
        pdf.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
        pdf.rect(col.checkX, cbY, cbSize, cbSize, 'F');
      } else {
        pdf.setDrawColor(MUTED[0], MUTED[1], MUTED[2]);
        pdf.setLineWidth(0.3);
        pdf.rect(col.checkX, cbY, cbSize, cbSize, 'S');
      }

      // Name
      const textColor = checked ? 160 : INK[0];
      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(textColor, textColor, textColor);
      pdf.text(nameLines, col.nameX, firstBaseline);

      // Amount (right-aligned) with a dotted leader
      const amountText = `${formatAmount(ing.amount)} ${ing.unit}`;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(10);
      const amountW = pdf.getTextWidth(amountText);
      const firstLineW = pdf.getTextWidth(nameLines[0]);
      drawDots(col.nameX + firstLineW + 2, col.amountX - amountW - 2, firstBaseline - 1);
      pdf.setTextColor(checked ? 160 : ACCENT[0], checked ? 160 : ACCENT[1], checked ? 160 : ACCENT[2]);
      pdf.text(amountText, col.amountX, firstBaseline, { align: 'right' });

      // Note
      if (noteLine) {
        pdf.setFont('times', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        pdf.text(noteLine, col.nameX, firstBaseline + nameLines.length * lh - 0.5);
      }

      y = rowTop + rowH;
    };

    const drawSection = (title: string, items: IngredientTotal[], checked: boolean) => {
      ensureSpace(16);
      spacedText(title.toUpperCase(), pageW / 2, y + 5, 11, 'bold', INK, 2.5);
      y += 10;

      if (items.length === 0) {
        spacedText(u.nothingToBuy, pageW / 2, y + 2, 10, 'italic', MUTED, 0.3);
        y += 8;
        return;
      }

      const half = Math.ceil(items.length / 2);
      const cols = [items.slice(0, half), items.slice(half)];
      const columnTop = y;
      let leftBottom = columnTop;

      cols.forEach((colItems, ci) => {
        y = columnTop;
        colItems.forEach((ing) => drawRow(ing, columns[ci], checked));
        if (ci === 0) leftBottom = y;
      });

      y = Math.max(leftBottom, y) + 5;
    };

    drawSection(u.needToBuy, needToBuy, false);
    if (haveItems.length > 0) {
      drawSection(u.whatIHave, haveItems, true);
    }

    // ------------------------------------------------------------------ Footer
    ensureSpace(22);
    y += 4;
    drawOrnament(y);
    y += 9;
    spacedText(u.pdfHappy, pageW / 2, y, 11, 'italic', ACCENT, 0.6);

    pdf.save('shopping-list.pdf');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <ChefHat className="mx-auto mb-4 h-12 w-12 animate-pulse text-brand-600 dark:text-brand-300" />
          <p className={labelText}>{UI[lang].loading}</p>
        </div>
      </div>
    );
  }

  const u = UI[lang];
  const ingredientTotals = getIngredientTotals(selectedPizzas, lang);
  const needToBuy = ingredientTotals.filter((ing) => !haveIngredients.includes(ingKey(ing.name, ing.unit)));
  const haveItems = ingredientTotals.filter((ing) => haveIngredients.includes(ingKey(ing.name, ing.unit)));

  const segBtn = (active: boolean) =>
    [
      'flex items-center justify-center gap-2 rounded px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.12em] transition-all',
      active
        ? 'bg-ink text-paper-50 dark:bg-char-100 dark:text-char-900'
        : 'text-ink-muted hover:text-ink dark:text-char-400 dark:hover:text-char-100',
    ].join(' ');

  const ingredientList = (items: { name: string; amount: number; unit: string }[]) => (
    <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 border-t border-dashed border-paper-400 pt-2 text-xs sm:grid-cols-2 dark:border-char-500">
      {items.map((ingredient, index) => (
        <li key={index} className="flex justify-between gap-2">
          <span className="truncate text-ink-soft dark:text-char-300">{ingredient.name}</span>
          <span className="shrink-0 font-mono font-medium tabular-nums text-ink dark:text-char-100">
            {formatAmount(ingredient.amount)} {ingredient.unit}
          </span>
        </li>
      ))}
    </ul>
  );

  const pizzaCard = (pizza: PartyPizza) => {
    const own = isMyPizza(pizza);
    const key = String(pizza.id);
    return (
      <div key={key} className={itemClass}>
        <div className="flex items-start justify-between gap-3">
          {photoUrl(pizza.imagePath) && (
            <img
              src={photoUrl(pizza.imagePath)}
              alt=""
              loading="lazy"
              className="aspect-square w-14 shrink-0 rounded border border-paper-300 object-cover sm:aspect-[3/2] sm:w-24 dark:border-char-600"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              {!own && (
                <span className="font-mono text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">
                  N° {pizza.id}
                </span>
              )}
              <h3 className="line-clamp-2 break-words font-display text-base font-bold text-ink dark:text-char-100">
                {pizza.name}
              </h3>
              {own && pizza.isPublic && (
                <Link
                  to={`/pizza/${pizza.id}`}
                  className="shrink-0 rounded-full border border-brand-400 px-2 py-0.5 font-mono text-[0.625rem] font-medium uppercase tracking-wider text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-400/60 dark:text-brand-300 dark:hover:bg-brand-900/30"
                >
                  {u.shared}
                </Link>
              )}
            </div>
            {pizza.description[lang] && (
              <p className="mt-0.5 line-clamp-2 font-display text-sm italic text-ink-muted dark:text-char-400">
                {pizza.description[lang]}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {own ? (
              <button
                type="button"
                aria-label={`${u.edit} ${pizza.name}`}
                title={u.edit}
                onClick={() => setEditing(pizza)}
                className={roundIconBtn}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                aria-label={`${u.copyToMine}: ${pizza.name}`}
                title={u.copyToMine}
                onClick={() => copyToMine(pizza)}
                className={roundIconBtn}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              aria-label={`${u.add}: ${pizza.name}`}
              onClick={() => addPizzaToSelection(pizza)}
              className={`${pillOutline} max-sm:px-2`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{u.add}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={!!expandedAvailable[key]}
          onClick={() => toggleAvailable(pizza.id)}
          className={disclosureBtn}
        >
          {u.ingredients(pizza.ingredients.length)}
          {expandedAvailable[key] ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {expandedAvailable[key] &&
          ingredientList(pizza.ingredients.map((i) => ({ name: i.name[lang], amount: i.amount, unit: i.unit[lang] })))}
      </div>
    );
  };

  return (
    <div className="text-ink dark:text-char-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 font-display text-4xl font-bold text-ink sm:text-5xl dark:text-char-100">{u.title}</h1>
          <p className="font-display text-lg italic text-ink-muted dark:text-char-400">{u.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Available Pizzas */}
          <section className={`${cardClass} self-start`}>
            <div className={cardHeader}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">01</span>
                <h2 className="font-display text-xl font-bold text-ink dark:text-char-100">{u.available}</h2>
              </div>
            </div>
            <div className="space-y-6 p-5 sm:p-6">
              {/* My pizzas */}
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className={labelText}>
                    {u.myPizzas} {mine.length > 0 && <span className="tabular-nums">({mine.length})</span>}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {mine.length > 0 && (
                      <button type="button" onClick={exportMyPizzas} className={pillOutline}>
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        {u.exportMine}
                      </button>
                    )}
                    <button type="button" onClick={() => importInput.current?.click()} className={pillOutline}>
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      {u.importMine}
                    </button>
                    <input
                      ref={importInput}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImportFile(file);
                        e.target.value = '';
                      }}
                    />
                    <button type="button" onClick={() => setEditing(null)} className={pillSolid}>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      {u.newPizza}
                    </button>
                  </div>
                </div>
                {auth.enabled && (
                  <p className="mb-3 font-display text-sm italic text-ink-muted dark:text-char-400">
                    {cloud ? (
                      u.savedCloud
                    ) : (
                      <>
                        {u.savedDevice}{' '}
                        <button
                          type="button"
                          onClick={() => auth.signInWithGoogle()}
                          className="not-italic underline decoration-dashed underline-offset-4 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
                        >
                          {u.signInToSync}
                        </button>
                      </>
                    )}
                  </p>
                )}
                {localOnly.length > 0 && !uploadDismissed && (
                  <div className="mb-3 rounded-md border border-dashed border-brand-400 bg-brand-50 px-4 py-3 dark:border-brand-400/60 dark:bg-brand-900/20">
                    <p className="font-display text-sm text-ink dark:text-char-100">{u.uploadPrompt(localOnly.length)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={async () => {
                          setUploading(true);
                          await uploadLocal();
                          setUploading(false);
                        }}
                        className={`${pillSolid} disabled:opacity-60`}
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        {u.upload}
                      </button>
                      <button type="button" onClick={() => setUploadDismissed(true)} className={pillOutline}>
                        {u.notNow}
                      </button>
                    </div>
                  </div>
                )}
                {storeError && (
                  <div
                    role="alert"
                    className="mb-3 flex items-start justify-between gap-3 rounded-md border border-brand-400 px-4 py-3 font-display text-sm text-brand-800 dark:border-brand-400/60 dark:text-brand-200"
                  >
                    <span>{u.storeErrors[storeError]}</span>
                    <button
                      type="button"
                      onClick={clearError}
                      className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-wider text-ink-muted hover:text-brand-700 dark:text-char-400 dark:hover:text-brand-300"
                    >
                      {u.dismiss}
                    </button>
                  </div>
                )}
                {notice && (
                  <p role="status" className="mb-3 font-display text-sm italic text-brand-700 dark:text-brand-300">
                    {notice}
                  </p>
                )}
                {mine.length === 0 ? (
                  <p className="rounded-md border border-dashed border-paper-400 px-4 py-5 text-center font-display text-sm italic text-ink-muted dark:border-char-500 dark:text-char-400">
                    {u.myEmpty}
                  </p>
                ) : (
                  <div className="space-y-2.5">{mine.map((pizza) => pizzaCard(pizza))}</div>
                )}
              </div>

              {/* House menu */}
              <div className="border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
                <h3 className={`mb-3 ${labelText}`}>{u.houseMenu}</h3>
                <div className="space-y-2.5">{house.map((pizza) => pizzaCard(pizza))}</div>
              </div>
            </div>
          </section>

          {/* Selected Pizzas */}
          <section className={`${cardClass} self-start`}>
            <div className={cardHeader}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">02</span>
                <h2 className="font-display text-xl font-bold text-ink dark:text-char-100">{u.selected}</h2>
              </div>
              {selectedPizzas.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-ink px-3 py-1 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-paper-50 dark:bg-char-100 dark:text-char-900">
                    {u.total(getTotalPizzas())}
                  </span>
                  <button
                    type="button"
                    onClick={clearAllSelections}
                    className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-brand-700 dark:text-char-400 dark:hover:text-brand-300"
                  >
                    {u.clearAll}
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              {selectedPizzas.length === 0 ? (
                <div className="rounded-md border border-dashed border-paper-400 py-12 text-center dark:border-char-500">
                  <ChefHat className="mx-auto mb-4 h-10 w-10 text-ink-muted opacity-60 dark:text-char-400" aria-hidden="true" />
                  <p className="font-display text-lg font-bold text-ink-soft dark:text-char-300">{u.empty}</p>
                  <p className="mt-1 font-display text-sm italic text-ink-muted dark:text-char-400">{u.emptyHint}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedPizzas.map((pizza) => (
                    <div key={pizza.id} className={itemClass}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-display text-base font-bold text-ink dark:text-char-100">{pizza.name}</h3>
                          <p className={labelText}>{u.pizzaCount(pizza.quantity)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex h-8 items-stretch overflow-hidden rounded-md border border-paper-400 bg-white/60 dark:border-char-500 dark:bg-char-900/60">
                            <button
                              type="button"
                              aria-label={`- ${pizza.name}`}
                              onClick={() => updatePizzaQuantity(pizza.id, pizza.quantity - 1)}
                              className={iconBtn}
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <span className="flex w-8 items-center justify-center border-x border-dashed border-paper-400 font-mono text-sm font-semibold tabular-nums text-ink dark:border-char-500 dark:text-char-100">
                              {pizza.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`+ ${pizza.name}`}
                              onClick={() => updatePizzaQuantity(pizza.id, pizza.quantity + 1)}
                              className={iconBtn}
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${pizza.name}`}
                            onClick={() => removePizzaFromSelection(pizza.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-paper-100 hover:text-brand-700 dark:text-char-400 dark:hover:bg-char-700 dark:hover:text-brand-300"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-expanded={!!expandedSelected[pizza.id]}
                        onClick={() => toggleSelected(pizza.id)}
                        className={disclosureBtn}
                      >
                        {u.ingredientsFor(pizza.quantity)}
                        {expandedSelected[pizza.id] ? (
                          <ChevronUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>

                      {expandedSelected[pizza.id] &&
                        ingredientList(
                          pizza.ingredients.map((i) => ({
                            name: i.name[lang],
                            amount: i.amount * pizza.quantity,
                            unit: i.unit[lang],
                          })),
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Export & Preview */}
        {selectedPizzas.length > 0 && (
          <section className={`mt-10 ${cardClass}`}>
            <div className={cardHeader}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">03</span>
                <h2 className="font-display text-xl font-bold text-ink dark:text-char-100">{u.exportPreview}</h2>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {/* Tabs + download */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-2 gap-1 rounded-md border border-paper-400 p-1 dark:border-char-500">
                  <button
                    type="button"
                    aria-pressed={previewTab === 'menu'}
                    onClick={() => setPreviewTab('menu')}
                    className={segBtn(previewTab === 'menu')}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    {u.eventMenu}
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewTab === 'shopping'}
                    onClick={() => setPreviewTab('shopping')}
                    className={segBtn(previewTab === 'shopping')}
                  >
                    <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                    {u.shoppingList}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => (previewTab === 'menu' ? downloadMenuPDF(lang) : downloadShoppingListPDF(lang))}
                  className={pillSolid}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>{u.downloadPdf}</span>
                </button>
              </div>

              {/* Active preview — a sheet of menu paper */}
              <div className="rounded-md border border-paper-300 bg-white/60 p-5 sm:p-8 dark:border-char-500 dark:bg-char-900/60">
                {previewTab === 'menu' ? (
                  <div>
                    <div className="border-b border-dashed border-paper-400 pb-4 text-center dark:border-char-500">
                      <h3 className="font-display text-3xl font-bold text-ink dark:text-char-100">{u.title}</h3>
                      <p className="mt-1 font-display text-sm italic text-ink-muted dark:text-char-400">{u.menuSub}</p>
                    </div>
                    <div className="divide-y divide-dashed divide-paper-400 dark:divide-char-500">
                      {selectedPizzas.map((pizza) => (
                        <div key={pizza.id} className="py-5 text-center">
                          {photoUrl(pizza.imagePath) && (
                            <img
                              src={photoUrl(pizza.imagePath)}
                              alt=""
                              loading="lazy"
                              className="mx-auto mb-3 aspect-[3/2] w-56 rounded border border-paper-300 object-cover dark:border-char-600"
                            />
                          )}
                          {isMyPizza(pizza) ? (
                            <p className="font-display text-xl font-bold text-ink dark:text-char-100">{pizza.name}</p>
                          ) : (
                            <p className="font-mono text-sm font-semibold tracking-[0.14em] text-brand-600 dark:text-brand-300">
                              N° {pizza.id}
                            </p>
                          )}
                          {pizza.description[lang] && (
                            <p className="mt-1 font-display text-lg italic text-ink dark:text-char-100">
                              {pizza.description[lang]}
                            </p>
                          )}
                          <p className="mt-2 text-sm text-ink-muted dark:text-char-400">
                            {pizza.ingredients.map((ing) => ing.name[lang]).join(' · ')}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 border-t border-dashed border-paper-400 pt-4 text-center font-display text-xl italic text-brand-700 dark:border-char-500 dark:text-brand-300">
                      {u.buonAppetito}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="border-b border-dashed border-paper-400 pb-4 text-center dark:border-char-500">
                      <h3 className="font-display text-3xl font-bold text-ink dark:text-char-100">{u.shoppingList}</h3>
                      <p className="mt-1 font-display text-sm italic text-ink-muted dark:text-char-400">{u.shoppingSub}</p>
                    </div>

                    <div className="mt-5 grid grid-cols-3 divide-x divide-dashed divide-paper-400 rounded-md border border-paper-300 bg-paper-100 py-3 text-center dark:divide-char-500 dark:border-char-600 dark:bg-char-700">
                      {[
                        { label: u.totalPizzas, value: getTotalPizzas() },
                        { label: u.pizzaTypes, value: selectedPizzas.length },
                        { label: u.ingredientsCount, value: ingredientTotals.length },
                      ].map((s) => (
                        <div key={s.label} className="px-1">
                          <p className="font-mono text-[0.625rem] font-medium uppercase tracking-wide text-ink-soft [overflow-wrap:anywhere] sm:text-[0.6875rem] sm:tracking-[0.14em] dark:text-char-400">
                            {s.label}
                          </p>
                          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-brand-700 dark:text-brand-300">
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <p className="flex items-center gap-2 font-display text-sm italic text-ink-muted dark:text-char-400">
                        <Info className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
                        {u.haveHint}
                      </p>
                      {haveIngredients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setHaveIngredients([])}
                          className="shrink-0 font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-ink-muted transition-colors hover:text-brand-700 dark:text-char-400 dark:hover:text-brand-300"
                        >
                          {u.clearHave}
                        </button>
                      )}
                    </div>

                    <h4 className={`mt-6 ${labelText}`}>{u.needToBuy}</h4>
                    {needToBuy.length === 0 ? (
                      <p className="mt-3 rounded-md border border-dashed border-paper-400 px-4 py-3 font-display text-sm italic text-ink-soft dark:border-char-500 dark:text-char-300">
                        {u.nothingToBuy}
                      </p>
                    ) : (
                      <ul className="mt-2 divide-y divide-dashed divide-paper-400 dark:divide-char-500">
                        {needToBuy.map((ing) => (
                          <IngredientRow
                            key={ingKey(ing.name, ing.unit)}
                            ing={ing}
                            have={false}
                            onToggle={() => toggleHave(ingKey(ing.name, ing.unit))}
                            ariaLabel={u.markHave}
                          />
                        ))}
                      </ul>
                    )}

                    {haveItems.length > 0 && (
                      <>
                        <h4 className={`mt-6 ${labelText}`}>{u.whatIHave}</h4>
                        <ul className="mt-2 divide-y divide-dashed divide-paper-400 dark:divide-char-500">
                          {haveItems.map((ing) => (
                            <IngredientRow
                              key={ingKey(ing.name, ing.unit)}
                              ing={ing}
                              have
                              onToggle={() => toggleHave(ingKey(ing.name, ing.unit))}
                              ariaLabel={u.markBuy}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {editing !== undefined && (
        <PizzaEditor
          pizza={editing}
          lang={lang}
          onSave={handleSavePizza}
          onDelete={editing ? () => handleDeletePizza(editing.id) : undefined}
          onClose={() => setEditing(undefined)}
          photoEnabled={cloud}
          onSignIn={auth.enabled ? () => auth.signInWithGoogle() : undefined}
        />
      )}
    </div>
  );
};

export default PartyMode;
