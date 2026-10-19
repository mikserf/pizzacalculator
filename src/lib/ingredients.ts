import type { Lang, LocalizedText, PizzaIngredient } from '../types/party';

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

interface UnitDef {
  sv: [one: string, many: string];
  en: [one: string, many: string];
  /** Other spellings people (or older data) use; matched case-insensitively. */
  aliases: string[];
}

/** Fixed units. Stored on ingredients as the plural forms ({sv, en}), shown singular/plural by amount. */
export const UNITS = {
  g: { sv: ['gram', 'gram'], en: ['gram', 'grams'], aliases: ['g', 'gr', 'grams', 'gram'] },
  kg: { sv: ['kg', 'kg'], en: ['kg', 'kg'], aliases: ['kilo', 'kilogram', 'kilograms'] },
  ml: { sv: ['ml', 'ml'], en: ['ml', 'ml'], aliases: ['milliliter', 'milliliters', 'millilitre', 'millilitres'] },
  dl: { sv: ['dl', 'dl'], en: ['dl', 'dl'], aliases: ['deciliter', 'decilitre'] },
  tsp: { sv: ['tsk', 'tsk'], en: ['tsp', 'tsp'], aliases: ['tesked', 'teskedar', 'teaspoon', 'teaspoons'] },
  tbsp: { sv: ['msk', 'msk'], en: ['tbsp', 'tbsp'], aliases: ['matsked', 'matskedar', 'tablespoon', 'tablespoons'] },
  pinch: { sv: ['nypa', 'nypor'], en: ['pinch', 'pinches'], aliases: [] },
  pcs: { sv: ['st', 'st'], en: ['pc', 'pcs'], aliases: ['styck', 'stycken', 'piece', 'pieces', 'x'] },
  leaf: { sv: ['blad', 'blad'], en: ['leaf', 'leaves'], aliases: [] },
  slice: { sv: ['skiva', 'skivor'], en: ['slice', 'slices'], aliases: [] },
  clove: { sv: ['klyfta', 'klyftor'], en: ['clove', 'cloves'], aliases: [] },
  handful: { sv: ['näve', 'nävar'], en: ['handful', 'handfuls'], aliases: [] },
  dash: { sv: ['skvätt', 'skvättar'], en: ['dash', 'dashes'], aliases: ['splash', 'drizzle'] },
} satisfies Record<string, UnitDef>;

export type UnitCode = keyof typeof UNITS;
export const UNIT_CODES = Object.keys(UNITS) as UnitCode[];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '');

const unitIndex = new Map<string, UnitCode>();
for (const code of UNIT_CODES) {
  const u: UnitDef = UNITS[code];
  [code, ...u.sv, ...u.en, ...u.aliases].forEach((s) => unitIndex.set(norm(s), code));
}

/** The unit code for a stored unit (either language, any known spelling), or null for free text. */
export function unitCode(unit: LocalizedText | string | undefined | null): UnitCode | null {
  if (!unit) return null;
  if (typeof unit === 'string') return unitIndex.get(norm(unit)) ?? null;
  return unitIndex.get(norm(unit.sv)) ?? unitIndex.get(norm(unit.en)) ?? null;
}

/** How a unit is stored: the plural forms in both languages. */
export const canonicalUnit = (code: UnitCode): LocalizedText => ({ sv: UNITS[code].sv[1], en: UNITS[code].en[1] });

/** "1 nypa" vs "2 nypor": the unit text for an amount, in the visitor's language. */
export function unitLabel(unit: LocalizedText | string, amount: number, lang: Lang): string {
  const code = unitCode(unit);
  if (!code) return typeof unit === 'string' ? unit : unit[lang];
  const [one, many] = UNITS[code][lang];
  return Math.abs(amount - 1) < 1e-9 ? one : many;
}

/* ------------------------------------------------------------------ */
/* Ingredient catalog                                                  */
/* ------------------------------------------------------------------ */

type Entry = [sv: string, en: string, ...aliases: string[]];

/** Known ingredients with both translations: the house menu first, then common extras. */
const CATALOG: Entry[] = [
  // House menu (public/data/pizzas.json)
  ['Tomatsås (San Marzano)', 'Tomato sauce (San Marzano)'],
  ['Salami', 'Salami'],
  ['Mozzarella di bufala DOP', 'Mozzarella di bufala DOP', 'buffalo mozzarella', 'buffelmozzarella'],
  ['Parmigiano', 'Parmigiano', 'parmigiano reggiano'],
  ['Torkad oregano', 'Dried oregano'],
  ['Basilikablad', 'Basil leaves'],
  ['Crème fraîche', 'Crème fraîche', 'creme fraiche'],
  ['Mozzarella', 'Mozzarella'],
  ['Färska champinjoner', 'Fresh mushrooms'],
  ['Vitlök', 'Garlic'],
  ['Pecorino Romano', 'Pecorino Romano'],
  ['Olivolja', 'Olive oil', 'extra virgin olive oil', 'evoo'],
  ['Persilja', 'Parsley'],
  ['Tryffelolja', 'Truffle oil'],
  ['Salt', 'Salt'],
  ['Svartpeppar', 'Black pepper', 'peppar', 'pepper'],
  ['Oregano', 'Oregano'],
  ['Basilika', 'Basil', 'färsk basilika', 'fresh basil'],
  ['Oliver', 'Olives'],
  ['Pecorino', 'Pecorino'],
  ['Nduja', 'Nduja', "'nduja"],
  ['Pancetta', 'Pancetta'],
  ['Gräddost', 'Cream cheese', 'philadelphia'],
  ['Sardeller', 'Anchovies', 'ansjovis', 'anchovy'],
  ['Körsbärstomater', 'Cherry tomatoes', 'cherrytomater'],
  ['Kapris', 'Capers'],
  ['Speck', 'Speck'],
  ['Parmesan', 'Parmesan'],
  ['Rödlök', 'Red onion'],
  ['Svampolja', 'Mushroom oil'],
  ['Nutella', 'Nutella'],
  ['Mascarpone', 'Mascarpone'],
  ['Hasselnötter', 'Hazelnuts'],
  ['Vaniljglass', 'Vanilla ice cream'],
  ['Bär', 'Berries'],
  ['Späck', 'Lard'],
  // Common extras
  ['Tomatsås', 'Tomato sauce', 'pizzasås', 'pizza sauce', 'passata'],
  ['Krossade tomater', 'Crushed tomatoes'],
  ['Färska tomater', 'Fresh tomatoes', 'tomater', 'tomatoes'],
  ['Soltorkade tomater', 'Sun-dried tomatoes', 'sundried tomatoes'],
  ['Skinka', 'Ham', 'kokt skinka', 'cooked ham'],
  ['Prosciutto', 'Prosciutto', 'parmaskinka', 'parma ham'],
  ['Pepperoni', 'Pepperoni'],
  ['Chorizo', 'Chorizo'],
  ['Bacon', 'Bacon'],
  ['Kyckling', 'Chicken'],
  ['Köttfärs', 'Ground beef', 'minced beef', 'mince'],
  ['Salsiccia', 'Italian sausage', 'salsiccia'],
  ['Tonfisk', 'Tuna'],
  ['Räkor', 'Shrimp', 'prawns'],
  ['Musslor', 'Mussels'],
  ['Ananas', 'Pineapple'],
  ['Paprika', 'Bell pepper', 'peppers', 'sweet pepper'],
  ['Jalapeño', 'Jalapeño', 'jalapeno', 'jalapenos', 'jalapeños'],
  ['Chili', 'Chili', 'chilli', 'färsk chili', 'fresh chili'],
  ['Chiliflakes', 'Chili flakes', 'chilli flakes', 'red pepper flakes'],
  ['Lök', 'Onion', 'gul lök', 'yellow onion'],
  ['Champinjoner', 'Mushrooms', 'svamp'],
  ['Spenat', 'Spinach'],
  ['Ruccola', 'Arugula', 'rocket', 'rucola'],
  ['Kronärtskocka', 'Artichoke', 'kronärtskockshjärtan', 'artichoke hearts'],
  ['Aubergine', 'Eggplant', 'aubergine'],
  ['Zucchini', 'Zucchini', 'courgette', 'squash'],
  ['Majs', 'Sweetcorn', 'corn'],
  ['Svarta oliver', 'Black olives', 'kalamataoliver', 'kalamata olives'],
  ['Gröna oliver', 'Green olives'],
  ['Gorgonzola', 'Gorgonzola'],
  ['Ricotta', 'Ricotta'],
  ['Burrata', 'Burrata'],
  ['Fior di latte', 'Fior di latte'],
  ['Riven ost', 'Grated cheese', 'shredded cheese'],
  ['Fetaost', 'Feta', 'feta cheese', 'feta'],
  ['Getost', 'Goat cheese', "goat's cheese", 'chèvre', 'chevre'],
  ['Provolone', 'Provolone'],
  ['Taleggio', 'Taleggio'],
  ['Pesto', 'Pesto'],
  ['Honung', 'Honey', 'hot honey'],
  ['Valnötter', 'Walnuts'],
  ['Pinjenötter', 'Pine nuts'],
  ['Rosmarin', 'Rosemary'],
  ['Timjan', 'Thyme'],
  ['Citron', 'Lemon', 'citronskal', 'lemon zest'],
  ['Ägg', 'Egg', 'eggs'],
  ['Potatis', 'Potato', 'potatoes'],
  ['Smör', 'Butter'],
  ['Grädde', 'Cream', 'vispgrädde', 'heavy cream'],
  ['Sesamfrön', 'Sesame seeds'],
];

const catalogIndex = new Map<string, LocalizedText>();
for (const [sv, en, ...aliases] of CATALOG) {
  const entry = { sv, en };
  // First entry wins, so the house menu names take precedence over extras.
  [sv, en, ...aliases].forEach((s) => {
    const k = norm(s);
    if (!catalogIndex.has(k)) catalogIndex.set(k, entry);
  });
}

/** Catalog entry for a typed or stored name (either language or a known alias), if any. */
export function findIngredient(text: string): LocalizedText | null {
  return catalogIndex.get(norm(text)) ?? null;
}

/** Name suggestions for the editor, in one language, alphabetical. */
export function ingredientSuggestions(lang: Lang): string[] {
  const names = new Set(CATALOG.map(([sv, en]) => (lang === 'sv' ? sv : en)));
  return Array.from(names).sort((a, b) => a.localeCompare(b, lang));
}

/**
 * Translate what can be translated: known ingredient names get both languages
 * from the catalog, known units become canonical. Free text is left as written.
 * Works on old data too, so nothing in the database needs migrating.
 */
export function localizeIngredient(ing: PizzaIngredient): PizzaIngredient {
  const name = findIngredient(ing.name.sv) ?? findIngredient(ing.name.en) ?? ing.name;
  const code = unitCode(ing.unit);
  return { ...ing, name, unit: code ? canonicalUnit(code) : ing.unit };
}
