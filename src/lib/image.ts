/**
 * Browser-side photo shrinking: phone photos are 3–8 MB, the bucket allows
 * 2 MB, and the free tier has 1 GB — so every photo is resized before upload.
 */

const MAX_SIDE = 1200;
const QUALITY = 0.82;

export interface PreparedImage {
  blob: Blob;
  /** File extension matching the blob type ("webp" or "jpg"). */
  ext: 'webp' | 'jpg';
}

const loadBitmap = async (file: Blob): Promise<ImageBitmap | HTMLImageElement> => {
  if ('createImageBitmap' in window) {
    try {
      // Applies the EXIF rotation, so portrait phone photos stay upright.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to <img> (e.g. HEIC on some browsers fails here too) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** Resize so the longest side is at most 1200 px and encode as WebP (JPEG where WebP isn't supported). */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const source = await loadBitmap(file);
  const w = source.width;
  const h = source.height;
  if (!w || !h) throw new Error('Unreadable image');
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ('close' in source) source.close();

  // Older Safari can't encode WebP and silently returns PNG — fall back to JPEG.
  const webp = await toBlob(canvas, 'image/webp', QUALITY);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };
  const jpeg = await toBlob(canvas, 'image/jpeg', QUALITY);
  if (!jpeg) throw new Error('Could not encode image');
  return { blob: jpeg, ext: 'jpg' };
}

/**
 * Load an image URL as a JPEG data URL cropped to the given aspect ratio —
 * jsPDF handles JPEG reliably, and a fixed ratio keeps the menu layout even.
 */
export async function imageToJpegDataUrl(url: string, aspect = 3 / 2, width = 900): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const source = await loadBitmap(await res.blob());
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round(width / aspect);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Cover-crop from the centre.
    const s = Math.max(canvas.width / source.width, canvas.height / source.height);
    const dw = source.width * s;
    const dh = source.height * s;
    ctx.drawImage(source, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    if ('close' in source) source.close();
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}
