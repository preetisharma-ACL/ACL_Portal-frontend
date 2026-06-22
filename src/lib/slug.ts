/** Parse a "slug-id" path segment, e.g. "iim-lucknow-42" -> { slug, id }. */
export function parseSlugId(slugId: string | undefined): { slug: string; id: number } {
  const s = slugId ?? "";
  const m = s.match(/^(.+)-(\d+)$/);
  if (m) return { slug: m[1], id: parseInt(m[2], 10) };
  return { slug: s, id: 0 };
}

/** Parse a listing slug "mba-colleges-varanasi" -> { course: "mba", city: "varanasi" }. */
export function parseListingSlug(slugRaw: string | undefined): { course: string; city: string } {
  const slug = slugRaw ?? "";
  const idx = slug.indexOf("-colleges-");
  if (idx >= 0) {
    return { course: slug.slice(0, idx), city: slug.slice(idx + "-colleges-".length) };
  }
  // Fallbacks: "colleges-in-varanasi" or bare slug.
  const m = slug.match(/colleges-(?:in-)?(.+)$/);
  if (m) return { course: "", city: m[1] };
  return { course: "", city: slug };
}

/** Turn an arbitrary label into a slug: "B.Com LL.B" -> "b-com-ll-b". */
export function slugify(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Build the canonical path for a city-wide colleges listing. */
export function cityCollegesPath(city: string): string {
  return `/colleges/${city}`;
}

/** Turn a slug into a Title Case label: "delhi-ncr" -> "Delhi Ncr". */
export function humanize(slug: string | undefined): string {
  return (slug ?? "")
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** Build the canonical listing path for a course + city. */
export function listingPath(stream: string, course: string, city: string): string {
  return `/${stream}/colleges/${course}-colleges-${city}`;
}
