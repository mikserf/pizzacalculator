import { useCallback, useEffect, useState } from 'react';
import { PartyPizza, PizzaId } from '../types/party';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { deletePhoto } from '../lib/photos';

const MY_PIZZAS_KEY = 'myPizzas';

/** True for pizzas the user created (string ids); house pizzas have numeric ids. */
export const isMyPizza = (pizza: { id: PizzaId }) => typeof pizza.id === 'string';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (id: PizzaId) => typeof id === 'string' && UUID_RE.test(id);

/** A v4 UUID — the cloud table's primary key type, so ids survive an upload. */
export const newPizzaId = (): string => {
  // randomUUID needs a secure context (https or localhost); fall back otherwise.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x: number) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const readLocalPizzas = (): PartyPizza[] => {
  try {
    const raw = localStorage.getItem(MY_PIZZAS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isValidPizza) : [];
  } catch {
    return [];
  }
};

const isLocalized = (v: unknown): boolean =>
  !!v && typeof v === 'object' && typeof (v as Record<string, unknown>).sv === 'string' &&
  typeof (v as Record<string, unknown>).en === 'string';

/** Loose shape check used for localStorage, imported files and cloud rows. */
export const isValidPizza = (p: unknown): p is PartyPizza => {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return (
    (typeof o.id === 'string' || typeof o.id === 'number') &&
    typeof o.name === 'string' &&
    isLocalized(o.description) &&
    Array.isArray(o.ingredients) &&
    o.ingredients.every(
      (i: unknown) =>
        !!i &&
        typeof i === 'object' &&
        isLocalized((i as Record<string, unknown>).name) &&
        typeof (i as Record<string, unknown>).amount === 'number' &&
        isLocalized((i as Record<string, unknown>).unit),
    )
  );
};

// ------------------------------------------------------------- Cloud mapping
const COLUMNS = 'id, name, description, ingredients, image_path, is_public';

interface PizzaRow {
  id: string;
  name: string;
  description: PartyPizza['description'];
  ingredients: PartyPizza['ingredients'];
  image_path: string | null;
  is_public: boolean;
}

const toRow = (p: PartyPizza): PizzaRow => ({
  id: p.id as string,
  name: p.name,
  description: p.description,
  ingredients: p.ingredients,
  image_path: p.imagePath ?? null,
  is_public: !!p.isPublic && !!p.imagePath,
});

const fromRow = ({ image_path, is_public, ...rest }: PizzaRow): PartyPizza => ({
  ...rest,
  ...(image_path ? { imagePath: image_path } : {}),
  ...(is_public ? { isPublic: true } : {}),
});

type StoreError = 'load' | 'save' | 'delete' | 'upload';

/**
 * Single source for Party Mode's pizzas: the read-only house menu plus the
 * user's own pizzas. Signed out, "mine" lives in localStorage; signed in, it
 * lives in Supabase (local pizzas stay on the device until uploaded).
 */
export function usePizzaStore() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const cloud = !!(supabase && userId);

  const [house, setHouse] = useState<PartyPizza[]>([]);
  const [houseLoading, setHouseLoading] = useState(true);
  const [local, setLocal] = useState<PartyPizza[]>(readLocalPizzas);
  const [remote, setRemote] = useState<PartyPizza[]>([]);
  /** Which user's pizzas `remote` holds, so "loading" is true until they arrive. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<StoreError | null>(null);

  useEffect(() => {
    fetch('/data/pizzas.json')
      .then((r) => r.json())
      .then((data) => setHouse(data.pizzas))
      .catch((err) => console.error('Error loading pizzas:', err))
      .finally(() => setHouseLoading(false));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MY_PIZZAS_KEY, JSON.stringify(local));
    } catch {
      /* storage full or blocked — keep working in memory */
    }
  }, [local]);

  // Load the signed-in user's pizzas.
  useEffect(() => {
    if (!supabase || !userId) {
      setRemote([]);
      setLoadedFor(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('pizzas')
      .select(COLUMNS)
      .eq('user_id', userId) // RLS also exposes other people's published pizzas
      .order('created_at')
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          console.error('Error loading your pizzas:', err);
          setError('load');
        } else {
          setRemote(((data ?? []) as PizzaRow[]).map(fromRow).filter(isValidPizza));
        }
        setLoadedFor(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const upsertRemote = (list: PartyPizza[]) =>
    setRemote((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      list.forEach((p) => byId.set(p.id, p));
      return Array.from(byId.values());
    });

  /** Insert or replace by id. Resolves to false if the cloud save failed (and was rolled back). */
  const savePizza = useCallback(
    async (pizza: PartyPizza): Promise<boolean> => {
      if (!cloud || !supabase) {
        setLocal((prev) =>
          prev.some((p) => p.id === pizza.id) ? prev.map((p) => (p.id === pizza.id ? pizza : p)) : [...prev, pizza],
        );
        return true;
      }
      const previous = remote;
      upsertRemote([pizza]); // optimistic
      const { error: err } = await supabase.from('pizzas').upsert(toRow(pizza));
      if (err) {
        console.error('Error saving pizza:', err);
        setRemote(previous);
        setError('save');
        return false;
      }
      return true;
    },
    [cloud, remote],
  );

  /** Photos only make sense in the account that owns them; drop anyone else's. */
  const ownPhotoOnly = useCallback(
    (p: PartyPizza): PartyPizza => {
      const rest = { ...p };
      delete rest.isPublic; // never publish something just by importing it
      if (rest.imagePath && !(userId && rest.imagePath.startsWith(`${userId}/`))) delete rest.imagePath;
      return rest;
    },
    [userId],
  );

  const removePizza = useCallback(
    (id: PizzaId) => {
      if (!cloud || !supabase) {
        setLocal((prev) => prev.filter((p) => p.id !== id));
        return;
      }
      const previous = remote;
      const photo = remote.find((p) => p.id === id)?.imagePath;
      setRemote((prev) => prev.filter((p) => p.id !== id));
      supabase
        .from('pizzas')
        .delete()
        .eq('id', id)
        .then(({ error: err }) => {
          if (err) {
            console.error('Error deleting pizza:', err);
            setRemote(previous);
            setError('delete');
          } else if (userId) {
            deletePhoto(userId, photo);
          }
        });
    },
    [cloud, remote, userId],
  );

  /** Merge pizzas from an exported file; returns how many were imported. */
  const importPizzas = useCallback(
    (data: unknown): number => {
      const list = Array.isArray(data) ? data : (data as { pizzas?: unknown })?.pizzas;
      if (!Array.isArray(list)) return 0;
      // Imported pizzas always become the user's own, with UUID ids.
      const valid = list
        .filter(isValidPizza)
        .map((p) => ownPhotoOnly({ ...p, id: isUuid(p.id) ? (p.id as string) : newPizzaId() }));
      if (valid.length === 0) return 0;
      if (cloud) {
        valid.forEach(savePizza);
      } else {
        setLocal((prev) => {
          const byId = new Map(prev.map((p) => [p.id, p]));
          valid.forEach((p) => byId.set(p.id, p));
          return Array.from(byId.values());
        });
      }
      return valid.length;
    },
    [cloud, savePizza, ownPhotoOnly],
  );

  /** Move the pizzas saved on this device into the signed-in account. */
  const uploadLocal = useCallback(async (): Promise<boolean> => {
    if (!supabase || !userId || local.length === 0) return false;
    const rows = local.map((p) => ownPhotoOnly(isUuid(p.id) ? p : { ...p, id: newPizzaId() }));
    const { error: err } = await supabase.from('pizzas').upsert(rows.map(toRow));
    if (err) {
      console.error('Error uploading pizzas:', err);
      setError('upload');
      return false;
    }
    upsertRemote(rows);
    setLocal([]);
    return true;
  }, [local, userId, ownPhotoOnly]);

  const mine = cloud ? remote : local;

  return {
    house,
    mine,
    all: [...mine, ...house],
    loading: houseLoading || authLoading || (cloud && loadedFor !== userId),
    cloud,
    /** Pizzas still only on this device while signed in (offer to upload). */
    localOnly: cloud ? local : [],
    error,
    clearError: () => setError(null),
    savePizza,
    removePizza,
    importPizzas,
    uploadLocal,
  };
}
