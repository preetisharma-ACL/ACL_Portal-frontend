/**
 * Build-time image optimiser.
 *
 * Re-encodes the oversized originals in /public into responsive, content-hashed
 * AVIF/WebP/JPEG (or PNG, where alpha matters) sets under /public/opt, and emits
 * a typed manifest at src/lib/generated/images.ts that the <Img> component and
 * the hero consume.
 *
 * The originals stay on disk untouched: nothing references them at runtime any
 * more, but keeping them means this script can be re-run (and the crop tweaked)
 * without re-sourcing the photography.
 *
 * Content hashes in the filenames are what make the long immutable TTL in
 * app.config.ts safe — an edited source produces a new URL rather than
 * overwriting a cached one.
 *
 *   node scripts/optimize-images.mjs          # regenerate everything
 *   node scripts/optimize-images.mjs --check  # fail if outputs are stale
 */
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const OUT_DIR = path.join(PUBLIC, "opt");
const MANIFEST = path.join(ROOT, "src", "lib", "generated", "images.ts");

/**
 * Encoder settings. AVIF quality is on a different curve to JPEG/WebP — 50 here
 * is visually equivalent to JPEG ~78, which is the band the brief asks for.
 */
const Q = { avif: 50, webp: 74, jpeg: 76, png: 90 };

/**
 * What to generate.
 *
 * `widths` are the intrinsic widths emitted for the srcset; they are capped at
 * the source's own width so we never upscale. `formats` is ordered by
 * preference — the last entry is the <img src> fallback. `lqip` emits a ~20px
 * blurred inline data URI (used only by the hero, to keep the first crossfade
 * from flashing).
 */
const ENTRIES = [
  // --- Homepage hero. Displayed full-bleed behind the H1, object-fit: cover. ---
  { src: "bg-image.jpg", widths: [640, 960, 1280, 1920, 2560], formats: ["avif", "webp", "jpeg"], lqip: true },
  { src: "bg-image2.jpg", widths: [640, 960, 1280, 1920, 2560], formats: ["avif", "webp", "jpeg"] },
  { src: "bg-image3.jpg", widths: [640, 960, 1280, 1920, 2560], formats: ["avif", "webp", "jpeg"] },

  // Card cover of last resort, for a city/college/article with no photo of its
  // own. Same crop as the hero (bg-cover bg-center over the source's 3:2 frame),
  // so it looks exactly as it always has — but sized for a 288px card instead of
  // handing every card the 8256px original.
  {
    src: "bg-image.jpg",
    as: "card-fallback",
    widths: [320, 640, 960],
    formats: ["avif", "webp", "jpeg"],
  },

  // --- City cards in CityCarousel. Displayed 288x160 CSS px. ---
  { src: "varanasi.jpg", widths: [320, 640, 960], formats: ["avif", "webp", "jpeg"] },
  { src: "lucknow.jpg", widths: [320, 640, 960], formats: ["avif", "webp", "jpeg"] },
  { src: "delhi.jpg", widths: [320, 640, 960], formats: ["avif", "webp", "jpeg"] },
  { src: "noida.jpg", widths: [320, 640, 960], formats: ["avif", "webp", "jpeg"] },
  { src: "banglore.jpg", widths: [320, 640, 960], formats: ["avif", "webp", "jpeg"] },

  // --- Page banners. Full-bleed section headers, object-fit: cover. ---
  { src: "aajneeti-banner.webp", widths: [640, 960, 1280, 1920], formats: ["avif", "webp", "jpeg"] },
  { src: "breadcrumb-area.png", widths: [640, 960, 1280, 1920], formats: ["avif", "webp", "jpeg"] },
  { src: "college-banner.png", widths: [640, 960, 1280, 1780], formats: ["avif", "webp", "jpeg"] },
  { src: "varanasi-banner.png", widths: [640, 960, 1280, 1521], formats: ["avif", "webp", "jpeg"] },
  { src: "students-banner.webp", widths: [640, 1008], formats: ["avif", "webp", "jpeg"] },

  // --- Transparent artwork. PNG fallback so the alpha channel survives. ---
  { src: "vector.png", widths: [505, 1010], formats: ["avif", "webp", "png"] },
  { src: "sms.webp", widths: [240, 480, 958], formats: ["avif", "webp", "png"] },
  { src: "customer-support.png", widths: [128, 256, 384, 612], formats: ["avif", "webp", "png"] },

  // --- Logos. Small, but the header logo is above the fold on every page. ---
  { src: "logo.png", widths: [200, 400, 865], formats: ["avif", "webp", "png"] },
  { src: "acl-logo.png", widths: [152, 304], formats: ["avif", "webp", "png"] },
  { src: "V2-aajneeti-logo.png", widths: [200], formats: ["webp", "png"] },
  { src: "bhu.png", widths: [215, 430, 860], formats: ["avif", "webp", "png"] },
  { src: "lpu.png", widths: [160, 320], formats: ["avif", "webp", "png"] },
  { src: "sharda.png", widths: [213, 425], formats: ["avif", "webp", "png"] },
  { src: "gla-university-online-logo.webp", widths: [193, 385], formats: ["avif", "webp", "png"] },
];

/** Every /public/colleges/*.jpg cover, rendered at 288x128 in the carousel. */
async function collegeEntries() {
  const dir = path.join(PUBLIC, "colleges");
  if (!existsSync(dir)) return [];
  const files = await fs.readdir(dir);
  return files
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
    .map((f) => ({
      src: `colleges/${f}`,
      widths: [320, 640, 960],
      formats: ["avif", "webp", "jpeg"],
    }));
}

const EXT = { avif: "avif", webp: "webp", jpeg: "jpg", png: "png" };
const MIME = { avif: "image/avif", webp: "image/webp", jpeg: "image/jpeg", png: "image/png" };

function encode(pipeline, format) {
  if (format === "avif") return pipeline.avif({ quality: Q.avif, effort: 6 });
  if (format === "webp") return pipeline.webp({ quality: Q.webp, effort: 5 });
  if (format === "png") return pipeline.png({ quality: Q.png, compressionLevel: 9, palette: true });
  return pipeline.jpeg({ quality: Q.jpeg, mozjpeg: true, progressive: true });
}

const hash8 = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 8);

async function buildEntry(entry, { write }) {
  const srcPath = path.join(PUBLIC, entry.src);
  const image = sharp(srcPath, { failOn: "none" });
  const meta = await image.metadata();
  // `as` renames the output and keys the manifest under "@name" instead of the
  // source path, so one source can produce more than one logical asset.
  const name = (entry.as ?? entry.src.replace(/\.[^.]+$/, ""))
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

  // Never upscale: drop requested widths above the source, but always keep at
  // least one (the source's own width) so small sources still get re-encoded.
  const widths = entry.widths.filter((w) => w <= meta.width);
  if (widths.length === 0) widths.push(meta.width);

  const sources = [];
  let fallback = null;

  for (const format of entry.formats) {
    const parts = [];
    for (const w of widths) {
      const buf = await encode(
        sharp(srcPath, { failOn: "none" }).resize({ width: w, withoutEnlargement: true }),
        format,
      ).toBuffer();
      const file = `${name}-${w}.${hash8(buf)}.${EXT[format]}`;
      if (write) await fs.writeFile(path.join(OUT_DIR, file), buf);
      parts.push({ url: `/opt/${file}`, w, bytes: buf.length });
    }
    const srcset = parts.map((p) => `${p.url} ${p.w}w`).join(", ");
    // The last format in the list is the <img> fallback, not a <source>.
    if (format === entry.formats.at(-1)) {
      // `src` is only used by browsers that ignore srcset, so it is capped at a
      // mid width rather than the largest variant — otherwise the no-srcset
      // fallback would pull the 2560px file.
      const base = parts.filter((p) => p.w <= 1280).at(-1) ?? parts[0];
      fallback = { src: base.url, srcset, widths: parts.map((p) => p.w) };
    } else {
      sources.push({ type: MIME[format], srcset });
    }
    entry._bytes = (entry._bytes ?? 0) + parts.reduce((a, p) => a + p.bytes, 0);
    if (format === entry.formats[0]) entry._smallest = parts[0].bytes;
  }

  let lqip;
  if (entry.lqip) {
    const buf = await sharp(srcPath, { failOn: "none" })
      .resize({ width: 20 })
      .blur(1.2)
      .jpeg({ quality: 40 })
      .toBuffer();
    lqip = `data:image/jpeg;base64,${buf.toString("base64")}`;
  }

  return {
    key: entry.as ? `@${entry.as}` : `/${entry.src}`,
    value: {
      width: meta.width,
      height: meta.height,
      sources,
      ...fallback,
      ...(lqip ? { lqip } : {}),
    },
  };
}

async function main() {
  const check = process.argv.includes("--check");
  const entries = [...ENTRIES, ...(await collegeEntries())].filter((e) => {
    const ok = existsSync(path.join(PUBLIC, e.src));
    if (!ok) console.warn(`  skip (missing): ${e.src}`);
    return ok;
  });

  if (!check) {
    await fs.rm(OUT_DIR, { recursive: true, force: true });
    await fs.mkdir(OUT_DIR, { recursive: true });
  }

  const manifest = {};
  for (const entry of entries) {
    const { key, value } = await buildEntry(entry, { write: !check });
    manifest[key] = value;
    const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
    const before = (await fs.stat(path.join(PUBLIC, entry.src))).size;
    console.log(
      `  ${entry.src.padEnd(44)} ${kb(before).padStart(7)} -> ${kb(entry._smallest).padStart(6)} (smallest variant)`,
    );
  }

  const body = `// GENERATED by scripts/optimize-images.mjs — do not edit by hand.
// Run \`npm run images\` to regenerate after changing anything in /public.

export type OptimizedImage = {
  /** Intrinsic size of the source, for width/height attributes. */
  width: number;
  height: number;
  /** <source> entries, best format first. */
  sources: { type: string; srcset: string }[];
  /** <img> fallback. */
  src: string;
  srcset: string;
  widths: number[];
  /** Tiny inline blurred placeholder, only where one is needed. */
  lqip?: string;
};

export const OPTIMIZED: Record<string, OptimizedImage> = ${JSON.stringify(manifest, null, 2)};
`;

  if (check) {
    const current = existsSync(MANIFEST) ? await fs.readFile(MANIFEST, "utf8") : "";
    if (current !== body) {
      console.error("\nImage manifest is stale. Run `npm run images` and commit the result.");
      process.exit(1);
    }
    console.log("\nImage manifest is up to date.");
    return;
  }

  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  await fs.writeFile(MANIFEST, body);
  console.log(`\nWrote ${Object.keys(manifest).length} entries to ${path.relative(ROOT, MANIFEST)}`);
}

await main();
