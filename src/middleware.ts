import { createMiddleware } from "@solidjs/start/middleware";
import { retiredCityRedirect } from "~/lib/slug";

/**
 * Server middleware. Runs ahead of routing, so a redirect here is a real
 * response rather than a client-side navigation.
 *
 * Its only job today is collapsing the city slugs retired by the backend's
 * duplicate-city merge (see RETIRED_CITY_SLUGS) onto the city that absorbed
 * them, with a 301 so the ranking those URLs already hold transfers instead of
 * being dropped. Everything else falls through untouched.
 */
export default createMiddleware({
  onRequest(event) {
    const url = new URL(event.request.url);
    const to = retiredCityRedirect(url.pathname);
    if (!to) return;
    return new Response(null, {
      status: 301,
      headers: { Location: to + url.search },
    });
  },
});
