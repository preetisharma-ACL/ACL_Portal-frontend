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
//
// The same split now applies to the image-optimiser config and the static asset
// cache headers below: vercel.json carries the readable copy, and what is
// actually honoured is what defu merges into .vercel/output/config.json here.
const SITEMAP_ORIGIN = "https://api.edu.aajneeti.social";
const sitemapRoutes = [
  { src: "^/robots\\.txt$", dest: `${SITEMAP_ORIGIN}/robots.txt` },
  { src: "^/sitemap\\.xml$", dest: `${SITEMAP_ORIGIN}/sitemap.xml` },
  { src: "^/sitemap-([^/]+)\\.xml$", dest: `${SITEMAP_ORIGIN}/sitemap-$1.xml` },
];

// Vercel Image Optimization. Payload serves whatever the admin uploaded — often
// a 5 MB original rendered into a 500px card — and those files change without a
// deploy, so they cannot be re-encoded at build time the way /public assets are.
// /_vercel/image resizes and re-encodes them at the edge instead.
//
// `sizes` is the allowlist of `w` values: a width not listed here is rejected at
// request time, so it must stay in sync with CDN_WIDTHS in src/lib/image.ts.
// `qualities` is deliberately omitted, which pins quality to Vercel's default of
// 75 — the value src/lib/image.ts requests.
const imagesConfig = {
  sizes: [96, 128, 256, 320, 384, 480, 640, 750, 828, 960, 1080, 1200, 1440, 1920, 2048],
  formats: ["image/avif", "image/webp"],
  minimumCacheTTL: 2678400, // 31 days
  remotePatterns: [
    { protocol: "https", hostname: "api.edu.aajneeti.social", pathname: "/media/**" },
  ],
};

// Cache-Control for everything served out of /public. Vercel's default for
// static files in the Build Output API is `max-age=0, must-revalidate`, i.e. a
// revalidation round-trip for every asset on every visit.
//
// `continue: true` makes these header-only rules: they annotate the response and
// fall through to the filesystem handler rather than terminating the match.
// Order matters — they must sit after the sitemap rewrites and before Nitro
// appends `{ handle: "filesystem" }`, which is where defu places them.
const IMMUTABLE = "public, max-age=31536000, immutable";
const REVALIDATE = "public, max-age=86400, stale-while-revalidate=604800";
const assetHeaderRoutes = [
  // Content-hashed by scripts/optimize-images.mjs — the filename changes when
  // the bytes do, so a year-long immutable TTL can never serve a stale image.
  {
    src: "/opt/(.*)",
    headers: { "cache-control": IMMUTABLE },
    continue: true,
  },
  // Self-hosted fonts, also content-hashed.
  {
    src: "/fonts/(.*)",
    headers: { "cache-control": IMMUTABLE },
    continue: true,
  },
  // Everything else in /public keeps a stable filename and can be overwritten in
  // place, so it gets a day of freshness plus a week of stale-while-revalidate
  // rather than an immutable TTL.
  {
    src: "/(.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|txt|xml|json|mp4|webm))",
    headers: { "cache-control": REVALIDATE },
    continue: true,
  },
];

export default defineConfig({
  ssr: true,
  middleware: "./src/middleware.ts",
  server: {
    preset,
    vercel: {
      config: {
        routes: [...sitemapRoutes, ...assetHeaderRoutes],
        images: imagesConfig,
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      // Remote media only goes through /_vercel/image on Vercel; the
      // node-server preset has no such endpoint, so the branch compiles out.
      __IMAGE_OPTIMIZER__: JSON.stringify(Boolean(env?.VERCEL)),
    },
  },
});
