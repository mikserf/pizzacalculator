import { supabase } from './supabase';
import type { PreparedImage } from './image';

const BUCKET = 'pizza-images';

/** Public URL for a stored photo path, or undefined without one. */
export const photoUrl = (path?: string | null): string | undefined =>
  path && supabase ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : undefined;

/**
 * Upload a pizza photo to "<userId>/<pizzaId>-<timestamp>.<ext>". The timestamp
 * gives every version a new URL, so browsers and the CDN never show a stale photo.
 */
export async function uploadPhoto(userId: string, pizzaId: string, image: PreparedImage): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured');
  const path = `${userId}/${pizzaId}-${Date.now()}.${image.ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, image.blob, {
    contentType: image.blob.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Best-effort delete; only touches files in the user's own folder. */
export async function deletePhoto(userId: string, path?: string | null): Promise<void> {
  if (!supabase || !path || !path.startsWith(`${userId}/`)) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error('Error deleting photo:', error);
}
