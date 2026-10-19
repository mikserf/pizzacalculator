/**
 * Percent value as text, without the "%" sign.
 * 10 and up: whole numbers (66); 1–10: one decimal (2.8); below 1: two
 * significant digits, so tiny yeast amounts stay readable (0.16, 0.016, 0.0042)
 * instead of rounding to 0.00.
 */
export function formatPercentValue(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return '0';
  if (v >= 10) return String(Math.round(v));
  if (v >= 1) return v.toFixed(1);
  const decimals = Math.min(6, 1 - Math.floor(Math.log10(v)));
  return v.toFixed(decimals);
}
