import { renderIndex, xmlResponse } from "~/lib/sitemap";

/** Sitemap index pointing at the segmented sitemaps. */
export function GET() {
  return xmlResponse(renderIndex(["/sitemap-content.xml", "/sitemap-colleges.xml"]));
}
