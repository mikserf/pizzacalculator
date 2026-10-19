import { supabase } from './supabase';
import type { CommunityPizza, SelectedPizza } from '../types/party';

export type FeedSort = 'latest' | 'top' | 'trending';
export const PAGE_SIZE = 24;

interface FeedRow {
  id: string;
  name: string;
  description: CommunityPizza['description'];
  ingredients: CommunityPizza['ingredients'];
  image_path: string;
  published_at: string;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  avg_score: number | string;
  rating_count: number;
  rank_score: number | string | null;
}

const fromRow = (r: FeedRow): CommunityPizza => ({
  id: r.id,
  name: r.name,
  description: r.description,
  ingredients: r.ingredients,
  imagePath: r.image_path,
  publishedAt: r.published_at,
  authorId: r.author_id,
  authorName: r.author_name,
  authorAvatar: r.author_avatar,
  avgScore: Number(r.avg_score) || 0,
  ratingCount: r.rating_count,
  rankScore: Number(r.rank_score) || 0,
});

const client = () => {
  if (!supabase) throw new Error('Community needs Supabase');
  return supabase;
};

export async function fetchFeed(sort: FeedSort, page: number): Promise<CommunityPizza[]> {
  const { data, error } = await client().rpc('community_pizzas', {
    sort,
    lim: PAGE_SIZE,
    off: page * PAGE_SIZE,
  });
  if (error) throw error;
  return ((data ?? []) as FeedRow[]).map(fromRow);
}

/** One published pizza, or null if it doesn't exist / was unpublished or hidden. */
export async function fetchCommunityPizza(id: string): Promise<CommunityPizza | null> {
  const { data, error } = await client().rpc('community_pizzas', { only_id: id, lim: 1 });
  if (error) throw error;
  const row = (data as FeedRow[] | null)?.[0];
  return row ? fromRow(row) : null;
}

export async function fetchMyRating(pizzaId: string, userId: string): Promise<number | null> {
  const { data, error } = await client()
    .from('ratings')
    .select('score')
    .eq('pizza_id', pizzaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.score ?? null;
}

export async function setMyRating(pizzaId: string, userId: string, score: number | null): Promise<void> {
  const ratings = client().from('ratings');
  const { error } =
    score === null
      ? await ratings.delete().eq('pizza_id', pizzaId).eq('user_id', userId)
      : await ratings.upsert({ pizza_id: pizzaId, user_id: userId, score });
  if (error) throw error;
}

/** Returns false if this user already reported the pizza. */
export async function reportPizza(pizzaId: string, reason: string): Promise<boolean> {
  const { error } = await client().from('reports').insert({ pizza_id: pizzaId, reason: reason.trim().slice(0, 500) });
  if (error?.code === '23505') return false; // unique (pizza, reporter)
  if (error) throw error;
  return true;
}

export async function fetchIsAdmin(): Promise<boolean> {
  const { data, error } = await client().rpc('is_admin');
  if (error) return false;
  return data === true;
}

export interface ModerationItem {
  pizzaId: string;
  name: string;
  imagePath: string | null;
  authorName: string | null;
  hidden: boolean;
  isPublic: boolean;
  openReports: number;
  reasons: string[];
  lastReport: string | null;
}

export async function fetchModeration(): Promise<ModerationItem[]> {
  const { data, error } = await client().rpc('admin_moderation');
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    pizzaId: r.pizza_id as string,
    name: r.name as string,
    imagePath: (r.image_path as string) ?? null,
    authorName: (r.author_name as string) ?? null,
    hidden: !!r.hidden,
    isPublic: !!r.is_public,
    openReports: Number(r.open_reports) || 0,
    reasons: (r.reasons as string[]) ?? [],
    lastReport: (r.last_report as string) ?? null,
  }));
}

export async function setHidden(pizzaId: string, hide: boolean): Promise<void> {
  const { error } = await client().rpc('admin_set_hidden', { target: pizzaId, hide });
  if (error) throw error;
}

/** Add a pizza to the Party Mode selection stored in this browser. */
export function addToParty(pizza: CommunityPizza): void {
  let list: SelectedPizza[] = [];
  try {
    const raw = localStorage.getItem('selectedPizzas');
    list = raw ? JSON.parse(raw) : [];
  } catch {
    list = [];
  }
  const existing = list.find((p) => p.id === pizza.id);
  const { id, name, description, ingredients, imagePath } = pizza;
  list = existing
    ? list.map((p) => (p.id === id ? { ...p, quantity: p.quantity + 1 } : p))
    : [...list, { id, name, description, ingredients, imagePath, quantity: 1 }];
  try {
    localStorage.setItem('selectedPizzas', JSON.stringify(list));
  } catch {
    /* storage blocked — nothing else to do */
  }
}
