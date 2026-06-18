import { SITE_ORIGIN } from "~/lib/config";

/** robots.txt: allow crawling, keep the noindex search results out, point to the sitemap. */
export function GET() {
  const body = [
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
