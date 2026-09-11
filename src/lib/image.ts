/**
 * Image URL helpers.
 *
 * Two kinds of image reach the markup:
 *
 *  - Bundled assets in /public. These are re-encoded ahead of time by
 *    scripts/optimize-images.mjs and looked up in the generated manifest, so a
 *    lookup here is a pure map read with no request-time cost.
 *
 *  - Remote media from Payload (api.edu.aajneeti.social/media/...). Those are
 *    whatever the admin uploaded — frequently 4-5 MB originals rendered into a
 *    500px card — and we cannot re-encode them at build time because they change
 *    without a deploy. They go through Vercel's image optimiser instead, which
 *    resizes and converts to AVIF/WebP at the edge and caches the result.
 *
 * The optimiser is only wired up on Vercel (see __IMAGE_OPTIMIZER__ in
 * app.config.ts). Locally, and on the node-server preset used for smoke tests,
 * remote URLs pass through untouched so nothing 404s.
 */
import { OPTIMIZED, type OptimizedImage } from "~/lib/generated/images";

/**
 * Widths the optimiser is allowed to produce. Must stay a subset of the `sizes`
 * array in app.config.ts / vercel.json — Vercel rejects any `w` not listed
 * there, which would show up as a broken image rather than a build error.
 */
export const CDN_WIDTHS = [
  96, 128, 256, 320, 384, 480, 640, 750, 828, 960, 1080, 1200, 1440, 1920, 2048,
] as const;

/**
 * Quality passed to the optimiser. 75 is Vercel's default and the only value
 * allowed unless a `qualities` array is configured, so it is deliberately not
 * parameterised.
 */
const CDN_QUALITY = 75;

/** True when the build targets Vercel and /_vercel/image exists. */
const OPTIMIZER_ON = __IMAGE_OPTIMIZER__;

/** A remote URL we are allowed to send through the optimiser. */
function isOptimizable(url: string): boolean {
  return OPTIMIZER_ON && /^https?:\/\//.test(url) && !/\.svg(\?|$)/i.test(url);
}

/** One optimiser URL at a given intrinsic width. */
export function cdnUrl(url: string, width: number): string {
  if (!isOptimizable(url)) return url;
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=${CDN_QUALITY}`;
}

/**
 * A srcset for a remote image, capped at `maxWidth` (the largest the layout can
 * ever display, at 2x) so we never pay to resize beyond what is usable.
 */
export function cdnSrcSet(url: string, maxWidth: number): string | undefined {
  if (!isOptimizable(url)) return undefined;
  const widths = CDN_WIDTHS.filter((w) => w <= maxWidth);
  if (widths.length === 0) return undefined;
  return widths.map((w) => `${cdnUrl(url, w)} ${w}w`).join(", ");
}

/** The pre-encoded variants for a bundled /public asset, if it has any. */
export function bundled(src: string): OptimizedImage | undefined {
  return OPTIMIZED[src];
}
