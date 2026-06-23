/**
 * Sitemap generation. URLs are gathered from the API client (so the live API
 * drives them once VITE_USE_MOCK is off) and grouped into segments referenced
 * by a sitemap index. The API contract has no "list all" endpoints for colleges
 * or exams, so those are gathered by walking listings and a representative course;
 * a dedicated backend sitemap feed should replace this sampling at scale.
 */
import * as api from "./api";
import { SITE_ORIGIN } from "./config";
import { listingPath } from "./slug";

export interface SitemapUrl {
  loc: string;
  changefreq?: string;
  priority?: number;
}

/** Cap on listing pages walked per stream+city when collecting college URLs. */
const MAX_LISTING_PAGES = 25;

function abs(path: string): string {
  return SITE_ORIGIN + (path.startsWith("/") ? path : "/" + path);
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );
}

/** Static, taxonomy, listing, course and exam pages. */
export async function contentUrls(): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  const statics = ["/", "/about", "/privacy-policy", "/terms", "/disclosure"];
  for (const s of statics) urls.push({ loc: abs(s), changefreq: "monthly", priority: 0.5 });

  const [streams, cities] = await Promise.all([api.getStreams(), api.getCities()]);
  for (const s of streams) {
    urls.push({ loc: abs(`/${s.slug}`), changefreq: "weekly", priority: 0.8 });
    for (const c of cities) {
      urls.push({
        loc: abs(listingPath(s.slug, s.slug, c.slug)),
        changefreq: "weekly",
        priority: 0.9,
      });
    }
  }

  // Courses and exams: no list-all endpoint, so use the representative MBA data.
  try {
    const stream = await api.getStream("mba");
    for (const c of stream.courses) {
      urls.push({ loc: abs(`/${c.slug}-course`), changefreq: "monthly", priority: 0.7 });
    }
  } catch {
    /* stream may be unavailable; skip */
  }
  try {
    const course = await api.getCourse("mba-pgdm");
    for (const e of course.related_exams) {
      urls.push({ loc: abs(`/mba/${e.slug}-exam`), changefreq: "monthly", priority: 0.7 });
    }
  } catch {
    /* course may be unavailable; skip */
  }

  // Editorial: articles index, category pages and every published article.
  urls.push({ loc: abs("/articles"), changefreq: "daily", priority: 0.7 });
  try {
    const cats = await api.getArticleCategories();
    for (const c of cats) {
      urls.push({ loc: abs(`/articles/category/${c.slug}`), changefreq: "weekly", priority: 0.6 });
    }
  } catch {
    /* categories may be unavailable; skip */
  }
  try {
    let page = 1;
    while (page <= 20) {
      const a = await api.getArticles({ page: String(page) });
      for (const art of a.results) {
        urls.push({ loc: abs(`/articles/${art.slug}`), changefreq: "weekly", priority: 0.7 });
      }
      if (!a.has_next) break;
      page += 1;
    }
  } catch {
    /* articles may be unavailable; skip */
  }
  return urls;
}

/** College detail pages, gathered by walking listings across streams and cities. */
export async function collegeUrls(): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  const seen = new Set<number>();
  const [streams, cities] = await Promise.all([api.getStreams(), api.getCities()]);

  for (const s of streams) {
    for (const c of cities) {
      let page = 1;
      while (page <= MAX_LISTING_PAGES) {
        let listing;
        try {
          listing = await api.getListing({ course: s.slug, city: c.slug, page: String(page) });
        } catch {
          break;
        }
        for (const col of listing.results) {
          if (!seen.has(col.id)) {
            seen.add(col.id);
            urls.push({
              loc: abs(`/college/${col.slug}-${col.id}`),
              changefreq: "weekly",
              priority: 0.7,
            });
          }
        }
        if (!listing.pagination.has_next) break;
        page += 1;
      }
    }
  }
  return urls;
}

export function renderUrlset(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts = [`<loc>${escapeXml(u.loc)}</loc>`];
      if (u.changefreq) parts.push(`<changefreq>${u.changefreq}</changefreq>`);
      if (u.priority != null) parts.push(`<priority>${u.priority.toFixed(1)}</priority>`);
      return `  <url>${parts.join("")}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function renderIndex(paths: string[]): string {
  const body = paths
    .map((p) => `  <sitemap><loc>${escapeXml(abs(p))}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
