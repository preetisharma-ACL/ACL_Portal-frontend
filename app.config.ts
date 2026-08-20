import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

// On Vercel (VERCEL=1 is set during their build) emit the Vercel build output;
// locally and in CI keep the node-server preset so `node .output/server/index.mjs`
// works for smoke tests and previews.
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  ?.env;
const preset = env?.VERCEL ? "vercel" : "node-server";

// robots.txt and the sitemaps are served by the backend, which generates them
// from the database and refreshes them when content is published in the admin.
// vercel.json declares the same three rewrites in the reviewable, conventional
// place; these are the Build Output API equivalents, because the Vercel preset
// writes its own .vercel/output/config.json and does not merge vercel.json's
// rewrites into it. Keep the two lists in sync.
const SITEMAP_ORIGIN = "https://api.edu.aajneeti.social";
const sitemapRoutes = [
  { src: "^/robots\\.txt$", dest: `${SITEMAP_ORIGIN}/robots.txt` },
  { src: "^/sitemap\\.xml$", dest: `${SITEMAP_ORIGIN}/sitemap.xml` },
  { src: "^/sitemap-([^/]+)\\.xml$", dest: `${SITEMAP_ORIGIN}/sitemap-$1.xml` },
];

export default defineConfig({
  ssr: true,
  middleware: "./src/middleware.ts",
  server: {
    preset,
    vercel: {
      config: {
        routes: sitemapRoutes,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
