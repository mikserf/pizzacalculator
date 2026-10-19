export type Lang = 'sv' | 'en';

export interface LocalizedText {
  sv: string;
  en: string;
}

export interface PizzaIngredient {
  name: LocalizedText;
  amount: number;
  unit: LocalizedText;
  note?: LocalizedText;
}

/** House pizzas (from pizzas.json) use numeric ids; user-created pizzas use UUID strings. */
export type PizzaId = number | string;

export interface PartyPizza {
  id: PizzaId;
  name: string;
  description: LocalizedText;
  ingredients: PizzaIngredient[];
  /** Storage path of the photo ("<userId>/<file>"), for signed-in users' pizzas. */
  imagePath?: string;
}

export interface PartyPizzaData {
  pizzas: PartyPizza[];
}

export interface SelectedPizza extends PartyPizza {
  quantity: number;
}
