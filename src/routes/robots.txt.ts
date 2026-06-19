import { SITE_ORIGIN, NOINDEX } from "~/lib/config";

/**
 * robots.txt. While NOINDEX is on, disallow all crawlers (the site may carry
 * draft legal text or demo data and must not be indexed yet). Once public
 * launch sets VITE_NOINDEX=false, allow crawling, keep /search out, and point
 * to the sitemap.
 */
export function GET() {
  const body = NOINDEX
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
