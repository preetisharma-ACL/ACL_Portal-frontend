import { contentUrls, renderUrlset, xmlResponse } from "~/lib/sitemap";

/** Static, taxonomy, listing, course and exam URLs. */
export async function GET() {
  const urls = await contentUrls();
  return xmlResponse(renderUrlset(urls));
}
