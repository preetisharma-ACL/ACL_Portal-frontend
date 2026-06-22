/** Display formatters. Kept in one place so fee strings are consistent. */

export interface MoneyRange {
  min?: number | null;
  max?: number | null;
}

/** Short Indian currency: 60000 -> ₹60K, 135000 -> ₹1.35L, 2500000 -> ₹25L. */
export function inrShort(value: number): string {
  const n = Number(value);
  if (!n || n <= 0) return "";
  if (n >= 1_00_000) {
    const lakhs = n / 1_00_000;
    return `₹${lakhs.toFixed(2).replace(/\.?0+$/, "")}L`;
  }
  if (n >= 1_000) return `₹${Math.round(n / 1_000)}K`;
  return `₹${n}`;
}

/**
 * Format a {min, max} fee range into a clean string. Falls back gracefully when
 * a bound is missing. Already-formatted strings are returned as-is so this is
 * safe to call on either the mock (string) or live ({min,max}) shape.
 */
export function formatFeeRange(range: MoneyRange | string | null | undefined): string {
  if (range == null) return "";
  if (typeof range === "string") return range;
  const min = Number(range.min) || 0;
  const max = Number(range.max) || 0;
  if (!min && !max) return "Fees on request";
  if (!max || min === max) return inrShort(min || max);
  if (!min) return `Up to ${inrShort(max)}`;
  return `${inrShort(min)} – ${inrShort(max)}`;
}

/** "PRIVATE" -> "Private", "DEEMED" -> "Deemed". */
export function titleCaseType(type: string | null | undefined): string {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}
