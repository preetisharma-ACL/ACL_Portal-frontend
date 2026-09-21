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
/** Shown when a college/course has no fee data yet (real fees come later from
 *  primary sources). Doubles as a lead-capture hook in the UI. */
export const FEES_ON_REQUEST = "Fees on request";

/**
 * Format a {min,max} fee range. Returns "" (empty) when there is no real fee
 * value, so callers render the {@link FEES_ON_REQUEST} state consistently
 * (`value || FEES_ON_REQUEST`) and automatically switch to numbers once fees
 * are added. Never returns 0, null, NaN or [object Object].
 */
export function formatFeeRange(range: MoneyRange | string | null | undefined): string {
  if (range == null) return "";
  if (typeof range === "string") return range.trim();
  const min = Number(range.min) || 0;
  const max = Number(range.max) || 0;
  if (!min && !max) return "";
  if (!max || min === max) return inrShort(min || max);
  if (!min) return `Up to ${inrShort(max)}`;
  return `${inrShort(min)} – ${inrShort(max)}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Deterministic date format ("12 Jun 2026"). Uses UTC getters so the server and
 *  client always produce the same string (toLocaleDateString varies by host
 *  timezone/locale and causes SSR hydration mismatches). */
export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "PRIVATE" -> "Private", "DEEMED" -> "Deemed". */
export function titleCaseType(type: string | null | undefined): string {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/** One step of a text block: its own line plus any indented lines under it. */
export interface TextStep {
  text: string;
  details: string[];
}

export interface TextBlock {
  /** "ordered" when the source numbered its steps, "unordered" for bullets,
   *  "text" for plain prose (render as paragraphs, never as a list). */
  kind: "ordered" | "unordered" | "text";
  steps: TextStep[];
}

const NUMBER_MARKER = /^\s*\(?(\d{1,2})[.)]\s+/;
const BULLET_MARKER = /^\s*[-–—•*]\s+/;

/**
 * Split a free-text field (admission process, eligibility) into steps.
 *
 * The CMS stores these as plain text with one step per line, each usually
 * prefixed "1." / "2.". HTML collapses those newlines, so rendering the raw
 * string drops every step into a single paragraph with the numbers running
 * into the sentences. Indented lines continue the step above them (sub-options
 * such as "NEET PG – MD/MS") instead of starting a new one.
 */
export function splitSteps(text: string | null | undefined): TextBlock {
  const raw = (text ?? "").replace(/\r\n?/g, "\n").trim();
  if (!raw) return { kind: "text", steps: [] };

  const steps: TextStep[] = [];
  let numbered = 0;
  let bulleted = 0;

  for (const line of raw.includes("\n") ? raw.split("\n") : splitInlineMarkers(raw)) {
    if (!line.trim()) continue;
    const number = line.match(NUMBER_MARKER);
    const marker = number ?? line.match(BULLET_MARKER);
    if (marker) {
      if (number) numbered++;
      else bulleted++;
    } else if (/^\s/.test(line) && steps.length) {
      steps[steps.length - 1].details.push(line.trim());
      continue;
    }
    steps.push({ text: line.slice(marker?.[0].length ?? 0).trim(), details: [] });
  }

  return {
    kind: numbered ? "ordered" : bulleted ? "unordered" : "text",
    steps: steps.filter((s) => s.text || s.details.length),
  };
}

/**
 * Fallback for rows saved with every step on one line ("1. … 2. …"): split on
 * the markers, but only when the text opens with "1." and the markers run in
 * sequence, so a sentence that merely contains "2." is left intact. Returns the
 * line untouched when it is ordinary prose.
 */
function splitInlineMarkers(line: string): string[] {
  const marks: { start: number; end: number }[] = [];
  const re = /(^|\s)(\d{1,2})[.)]\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (Number(m[2]) === marks.length + 1) {
      marks.push({ start: m.index + m[1].length, end: m.index + m[0].length });
    }
  }
  if (marks.length < 2 || marks[0].start !== 0) return [line];
  return marks
    .map((mk, i) => line.slice(mk.start, marks[i + 1]?.start).trim())
    .filter(Boolean);
}
