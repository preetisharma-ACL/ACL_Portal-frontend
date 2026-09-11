/**
 * Image weight guardrail.
 *
 * Two rules, both aimed at the same regression: an oversized original being
 * handed straight to the browser.
 *
 *  1. Nothing hand-placed in /public may exceed MAX_BYTES. A file dropped in
 *     there is served at one size to every device, so a 5 MB camera original
 *     becomes a 5 MB download — which is exactly how /bg-image.jpg ended up the
 *     LCP element on mobile.
 *
 *  2. No raw <img src="/…"> or CSS url('/…') may point at one of those
 *     originals. They are still on disk as the optimiser's input, and their
 *     paths are still written in the source — but only ever as keys handed to
 *     <Img>, which resolves them to the pre-encoded /opt variants. Referencing
 *     one directly bypasses that and ships the original.
 *
 *   node scripts/check-image-budget.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

/**
 * Per-file budget for anything hand-placed in /public and referenced directly.
 * 300 KB is already generous for a single fixed-size asset.
 */
const MAX_BYTES = 300 * 1024;

/**
 * Generated responsive variants under /opt get a higher ceiling, because the
 * browser only ever picks the one matching its viewport — the 2560px hero frame
 * is never sent to a phone. The cap is here purely to catch an encoder setting
 * that has gone wrong.
 */
const MAX_VARIANT_BYTES = 512 * 1024;

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

/**
 * Oversized files that are allowed to stay in /public because they are only the
 * optimiser's input, never served. Each entry must have a /opt derivative and
 * must not be referenced raw (rule 2 enforces both).
 */
const OPTIMISER_SOURCES = new Set([
  "V2-aajneeti-logo.png",
  "aajneeti-banner.webp",
  "acl-logo.png",
  "banglore.jpg",
  "bg-image.jpg",
  "bg-image2.jpg",
  "bg-image3.jpg",
  "bhu.png",
  "breadcrumb-area.png",
  "college-banner.png",
  "customer-support.png",
  "delhi.jpg",
  "gla-university-online-logo.webp",
  "logo.png",
  "lpu.png",
  "lucknow.jpg",
  "noida.jpg",
  "sharda.png",
  "sms.webp",
  "students-banner.webp",
  "varanasi-banner.png",
  "varanasi.jpg",
  "vector.png",
]);

/**
 * Over budget, referenced raw, and deliberately left that way.
 *
 * These three are animated SVGs with embedded raster frames. Re-encoding them
 * to AVIF/WebP would drop the animation, which is a visual change rather than a
 * perf fix, so they keep their vector form. They are decorative illustrations on
 * /about (and one card on /…-course), all lazy and below the fold, and SVG is
 * text so the CDN compresses it in transit. Revisit by re-exporting them from
 * source with fewer embedded frames, not by rasterising here.
 */
const ACCEPTED_OVERSIZE = new Set([
  "3D Digital Marketing.svg",
  "Online Exam.svg",
  "Study Abroad.svg",
]);

const isOptimiserInput = (rel) =>
  OPTIMISER_SOURCES.has(rel) || rel.startsWith("colleges/");

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Every asset path the source references *directly* — as a raw <img src>, a CSS
 * url(), or a `srcset` literal. Paths that only appear as bare strings (the keys
 * handed to <Img>, e.g. CITY_IMAGES) are not direct references and are fine.
 */
async function directReferences() {
  const found = new Map(); // decoded path -> file it was seen in
  const patterns = [
    // Raw <img …src="/x.jpg"…>, including multi-line attribute lists. Matched
    // case-sensitively on purpose: <Img> is our component, which resolves the
    // path through the manifest and is exactly what we want people to use.
    /<img\b[^>]*?\bsrc=\{?["'](\/[^"']+)["']/gs,
    /<source\b[^>]*?\bsrcset=\{?["']([^"']+)["']/gs,
    // url('/x.jpg') in a style attribute or a CSS file
    /url\(\s*['"]?(\/[^"')]+)/gi,
  ];

  for await (const f of walk(path.join(ROOT, "src"))) {
    if (!/\.(tsx?|css)$/.test(f) || f.includes("generated")) continue;
    const text = await fs.readFile(f, "utf8");
    const rel = path.relative(ROOT, f).split(path.sep).join("/");
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        for (const raw of m[1].split(",")) {
          const url = raw.trim().split(/\s+/)[0];
          if (!url.startsWith("/") || url.startsWith("/opt/")) continue;
          let decoded = url;
          try {
            decoded = decodeURIComponent(url);
          } catch {
            /* leave as-is */
          }
          if (!found.has(decoded.slice(1))) found.set(decoded.slice(1), rel);
        }
      }
    }
  }
  return found;
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

const referenced = await directReferences();
const oversize = [];
const bypassed = [];

for await (const full of walk(PUBLIC)) {
  const rel = path.relative(PUBLIC, full).split(path.sep).join("/");
  if (!IMAGE_RE.test(rel)) continue;
  const { size } = await fs.stat(full);

  if (isOptimiserInput(rel)) {
    // Rule 2: an optimiser input must never be referenced directly.
    if (referenced.has(rel)) bypassed.push({ rel, size, from: referenced.get(rel) });
    continue;
  }

  // Rule 1: everything else is subject to the size budget.
  if (ACCEPTED_OVERSIZE.has(rel)) continue;
  const budget = rel.startsWith("opt/") ? MAX_VARIANT_BYTES : MAX_BYTES;
  if (size > budget) oversize.push({ rel, size, budget });
}

let failed = false;

if (bypassed.length) {
  failed = true;
  console.error(`\nUnoptimised original referenced directly — render it through <Img> instead:`);
  for (const f of bypassed) console.error(`  ${f.rel}  ${kb(f.size)}   (in ${f.from})`);
}

if (oversize.length) {
  failed = true;
  console.error(`\nImages over budget:`);
  for (const f of oversize.sort((a, b) => b.size - a.size)) {
    console.error(`  ${f.rel}  ${kb(f.size)} (max ${kb(f.budget)})`);
  }
  console.error(`\nAdd them to scripts/optimize-images.mjs, or shrink the source.`);
}

if (failed) process.exit(1);
console.log(
  `Image budget OK — ${referenced.size} direct references, nothing servable over ${kb(MAX_BYTES)}.`,
);
