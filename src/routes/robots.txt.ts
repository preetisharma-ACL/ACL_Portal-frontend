import { SITE_ORIGIN, USE_MOCK } from "~/lib/config";

/**
 * robots.txt. In mock/preview mode disallow all crawlers (the preview carries
 * draft legal text and placeholder data and must never be indexed). In
 * production (mock off) allow crawling, keep the noindex /search out, and point
 * to the sitemap.
 */
export function GET() {
  const body = USE_MOCK
    ? ["User-agent: *", "Disallow: /", ""].join("\n")
    : [
        "User-agent: *",
        "Allow: /",
        "Disallow: /search",
        "",
        `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
        "",
      ].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
