import { collegeUrls, renderUrlset, xmlResponse } from "~/lib/sitemap";

/** College detail page URLs. */
export async function GET() {
  const urls = await collegeUrls();
  return xmlResponse(renderUrlset(urls));
}
