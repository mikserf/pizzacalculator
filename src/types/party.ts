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
  /** Shared in the community feed (requires a photo). */
  isPublic?: boolean;
}

/** A published pizza as the community feed returns it. */
export interface CommunityPizza extends PartyPizza {
  id: string;
  imagePath: string;
  publishedAt: string;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  avgScore: number;
  ratingCount: number;
  /** Sort key for the requested tab (publish time, Bayesian score or trend weight). */
  rankScore: number;
}

export interface PartyPizzaData {
  pizzas: PartyPizza[];
}

export interface SelectedPizza extends PartyPizza {
  quantity: number;
}
