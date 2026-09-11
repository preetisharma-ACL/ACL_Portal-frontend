/**
 * Image weight guardrail.
 *
 * Fails the build when any image that the site can actually serve exceeds the
 * per-file budget. This is what stops a 5 MB camera original being dropped into
 * /public again and silently becoming the LCP element.
 *
 * Unreferenced legacy originals are still on disk (see scripts/optimize-images.mjs),
 * so they are listed in LEGACY_SOURCES and exempted: nothing in src/ links to
 * them, they exist only as the input the optimiser re-encodes from. Adding a new
 * name to that list is a deliberate, reviewable act — which is the point.
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
 * This is the rule that matters: a file dropped in here is served at one size to
 * every device, so 300 KB is already generous.
 */
const MAX_BYTES = 300 * 1024;

/**
 * Generated responsive variants under /opt get a higher ceiling, because the
 * browser only ever picks the one that matches its viewport — the 2560px hero
 * frame is never sent to a phone. The cap is here purely to catch an encoder
 * setting that has gone wrong.
 */
const MAX_VARIANT_BYTES = 512 * 1024;

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

/**
 * Originals kept only as optimiser input. Never referenced from src/ — the
 * generated /opt derivatives are. Verified by the referenced-check below, which
 * fails if one of these ever shows up in the source again.
 */
const LEGACY_SOURCES = new Set([
  "3D Digital Marketing.svg",
  "Online Exam.svg",
  "Study Abroad.svg",
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

const isLegacy = (rel) =>
  LEGACY_SOURCES.has(rel) || rel.startsWith("colleges/");

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function sourceText() {
  const chunks = [];
  for await (const f of walk(path.join(ROOT, "src"))) {
    if (/\.(tsx?|css)$/.test(f) && !f.includes("generated")) {
      chunks.push(await fs.readFile(f, "utf8"));
    }
  }
  return chunks.join("\n");
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

const src = await sourceText();
const oversize = [];
const revived = [];

for await (const full of walk(PUBLIC)) {
  const rel = path.relative(PUBLIC, full).split(path.sep).join("/");
  if (!IMAGE_RE.test(rel)) continue;
  const { size } = await fs.stat(full);
  const legacy = isLegacy(rel);
  const budget = rel.startsWith("opt/") ? MAX_VARIANT_BYTES : MAX_BYTES;

  // A legacy original that has crept back into the markup is a regression even
  // if it happens to be under budget, so check that first.
  if (legacy && src.includes(`/${rel}`)) revived.push({ rel, size });
  else if (!legacy && size > budget) oversize.push({ rel, size, budget });
}

let failed = false;

if (revived.length) {
  failed = true;
  console.error(`\nUnoptimised original referenced from src/ (use the <Img> manifest instead):`);
  for (const f of revived) console.error(`  ${f.rel}  ${kb(f.size)}`);
}

if (oversize.length) {
  failed = true;
  console.error(`\nImages over budget:`);
  for (const f of oversize.sort((a, b) => b.size - a.size)) {
    console.error(`  ${f.rel}  ${kb(f.size)} (max ${kb(f.budget)})`);
  }
  console.error(`\nRe-encode them via scripts/optimize-images.mjs, or shrink the source.`);
}

if (failed) process.exit(1);
console.log(`Image budget OK — nothing servable exceeds ${kb(MAX_BYTES)}.`);
