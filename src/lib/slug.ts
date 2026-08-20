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

/**
 * City slugs retired by the backend's duplicate-city merge. Each key is a spare
 * row that no longer exists; the value is the city that absorbed it.
 *
 * The API answers an unknown city with 200 + `city: null`, not a 404, so without
 * this map a retired slug would keep returning an empty page forever. Requests
 * for a key are 301'd to its surviving city by src/middleware.ts, so the pages
 * these URLs have already earned consolidate onto one city.
 *
 * The complete set: 11 retired rows onto 10 cities (Surat absorbed two).
 *
 * This is an explicit map and must stay one. It is NOT a {city}-{state} pattern,
 * and three live city slugs would be destroyed by one:
 *
 *   amritsar-punjab                  9 colleges. It was filed under the wrong
 *                                    state and kept its slug when the name and
 *                                    state were corrected, so the slug survived
 *                                    a correction that looks like a merge.
 *   gangapur-varanasi-uttar-pradesh  Gangapur is a locality in Varanasi.
 *   kalyani-nadia-west-bengal        Kalyani is in Nadia district.
 *
 * The first two segments there are locality names, not city + state. Adding a
 * new entry means confirming the source slug no longer resolves in the API.
 */
export const RETIRED_CITY_SLUGS: Record<string, string> = {
  "agra-uttar-pradesh": "agra",
  "ahmedabad-gujarat": "ahmedabad",
  "gandhinagar-gujarat": "gandhinagar",
  "jaipur-rajasthan": "jaipur",
  "kolkata-west-bengal": "kolkata",
  "ludhiana-punjab": "ludhiana",
  "mumbai-maharashtra": "mumbai",
  "mysuru-karnataka": "mysuru",
  "pune-maharashtra": "pune",
  "surat-gujarat": "surat",
  "surat-kosamba-gujarat": "surat",
};

/**
 * The path a retired city slug should redirect to, or undefined when the path
 * does not name a retired city. Handles both listing URL shapes:
 *   /colleges/{city}
 *   /{stream}/colleges/{course}-colleges-{city}
 */
export function retiredCityRedirect(pathname: string): string | undefined {
  const cityMode = pathname.match(/^\/colleges\/([^/]+?)\/?$/);
  if (cityMode) {
    const to = RETIRED_CITY_SLUGS[cityMode[1].toLowerCase()];
    return to ? cityCollegesPath(to) : undefined;
  }
  // Non-greedy course, mirroring parseListingSlug's first "-colleges-" split.
  const listing = pathname.match(/^\/([^/]+)\/colleges\/(.+?)-colleges-([^/]+?)\/?$/);
  if (listing) {
    const to = RETIRED_CITY_SLUGS[listing[3].toLowerCase()];
    return to ? listingPath(listing[1], listing[2], to) : undefined;
  }
  return undefined;
}
