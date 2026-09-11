/**
 * Self-hosts the web fonts.
 *
 * The site loaded Inter and Plus Jakarta Sans from fonts.googleapis.com. That
 * stylesheet is render-blocking and measured at 750 ms, and it is only the first
 * hop: the browser then has to connect to a second origin (fonts.gstatic.com)
 * before it can even start the .woff2 files. Serving both from our own origin
 * removes two cross-origin connections and the blocking stylesheet entirely.
 *
 * This script fetches exactly the families, weights and subsets the site
 * requested, downloads the .woff2 files Google would have served, and writes:
 *
 *   public/fonts/<family>-<weight>-<subset>.<hash>.woff2   (content-hashed)
 *   src/generated/fonts.css                                (the @font-face rules)
 *   src/lib/generated/fonts.ts                             (which to preload)
 *
 * The @font-face rules keep Google's own `unicode-range` values verbatim, so the
 * browser still downloads only the subsets a page actually renders — the same
 * behaviour as before, minus the round trips.
 *
 * It also emits a metric-matched fallback face. The real metrics are read out of
 * the font tables themselves (the downloaded .woff2, and the local Arial the
 * fallback stands in for), not hard-coded, so the fallback occupies the same
 * space as the web font and
 * the swap does not move text. That is the layout shift Lighthouse attributes to
 * the two fonts.gstatic.com .woff2 files.
 *
 *   node scripts/fetch-fonts.mjs
 */
import { createHash } from "node:crypto";
import { brotliDecompressSync } from "node:zlib";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "fonts");
const CSS_OUT = path.join(ROOT, "src", "generated", "fonts.css");
const TS_OUT = path.join(ROOT, "src", "lib", "generated", "fonts.ts");

/**
 * Exactly what entry-server.tsx used to request. Keeping this literal means the
 * self-hosted set cannot silently drift from the families the design uses.
 */
const GOOGLE_CSS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap";

/**
 * Subsets to keep.
 *
 * `latin` covers the body copy. `latin-ext` is not optional here: the rupee sign
 * (U+20B9) used throughout the fee copy lives in its range, so dropping it would
 * render every "₹" in a fallback face.
 */
const SUBSETS = new Set(["latin", "latin-ext"]);

/**
 * Faces to preload. These two render above the fold on every page — Inter 400
 * for body copy, Plus Jakarta Sans 800 for the h1 — so they are worth a preload
 * hint. Everything else is discovered from the stylesheet as usual.
 */
const PRELOAD = [
  { family: "Inter", weight: 400, subset: "latin" },
  { family: "Plus Jakarta Sans", weight: 800, subset: "latin" },
];

/** Local font the fallback face is built on, and the stack it stands in for. */
const FALLBACK = {
  file: "C:/Windows/Fonts/arial.ttf",
  // Named per family so each web font gets its own correctly-adjusted fallback.
  stack: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`,
};

const MODERN_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function getText(url, ua) {
  const res = await fetch(url, { headers: { "User-Agent": ua } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

async function getBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": MODERN_UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Parse @font-face blocks out of a Google Fonts stylesheet. */
function parseFaces(css) {
  const faces = [];
  // Google prefixes every block with a `/* subset */` comment.
  const re =
    /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  for (const m of css.matchAll(re)) {
    const subset = m[1];
    const body = m[2];
    const get = (prop) => body.match(new RegExp(`${prop}:\\s*([^;]+);`))?.[1]?.trim();
    const url = body.match(/url\(([^)]+)\)/)?.[1];
    if (!url) continue;
    faces.push({
      subset,
      family: get("font-family")?.replace(/['"]/g, "") ?? "",
      style: get("font-style") ?? "normal",
      weight: Number(get("font-weight") ?? 400),
      unicodeRange: get("unicode-range") ?? "",
      url,
    });
  }
  return faces;
}

// ----------------------------------------------------------------- metrics --

/**
 * The 63 table tags WOFF2 encodes as a 6-bit index instead of a 4-byte tag.
 * Order is normative (WOFF2 spec, "Known Table Tags").
 */
// prettier-ignore
const WOFF2_KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
  "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern",
  "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC",
  "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty",
  "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

/** WOFF2's variable-length unsigned integer. */
function readBase128(buf, pos) {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const b = buf[pos++];
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) return [value >>> 0, pos];
  }
  throw new Error("malformed UIntBase128");
}

/**
 * Locate head/hhea/OS-2 inside a WOFF2 and return their bytes.
 *
 * WOFF2 stores the tables brotli-compressed and concatenated in directory order
 * with no padding, so the offset of a table is the sum of the lengths before it.
 * Only glyf and loca are ever transformed; the three metric tables are stored
 * verbatim, which is why this can read them without understanding the transform.
 */
function woff2Tables(buf) {
  const numTables = buf.readUInt16BE(12);
  let pos = 48;
  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[pos++];
    const known = flags & 0x3f;
    const tag = known === 63 ? buf.toString("ascii", pos, (pos += 4)) : WOFF2_KNOWN_TAGS[known];
    let origLength;
    [origLength, pos] = readBase128(buf, pos);
    const transformVersion = (flags >> 6) & 0x03;
    const isGlyfOrLoca = tag === "glyf" || tag === "loca";
    const transformed = isGlyfOrLoca ? transformVersion !== 3 : transformVersion !== 0;
    let length = origLength;
    if (transformed) [length, pos] = readBase128(buf, pos);
    dir.push({ tag, length, transformed });
  }

  const data = brotliDecompressSync(buf.subarray(pos));
  const out = {};
  let offset = 0;
  for (const t of dir) {
    out[t.tag] = data.subarray(offset, offset + t.length);
    // hmtx has its own WOFF2 transform, which changes where the advance widths
    // live. readMetrics needs to know, so flag it on the buffer.
    out[t.tag].woff2Transformed = t.transformed;
    offset += t.length;
  }
  return out;
}

/** Plain TrueType/OpenType table directory. */
function sfntTables(buf) {
  const numTables = buf.readUInt16BE(4);
  const out = {};
  for (let i = 0; i < numTables; i++) {
    const off = 12 + i * 16;
    const tag = buf.toString("ascii", off, off + 4);
    const start = buf.readUInt32BE(off + 8);
    out[tag] = buf.subarray(start, start + buf.readUInt32BE(off + 12));
  }
  return out;
}

/**
 * Relative frequency of each character in English prose, space included.
 *
 * This is what the average advance width is weighted by. Using OS/2's
 * xAvgCharWidth instead looks tempting and is wrong: its definition changed
 * between OS/2 versions (weighted over lowercase letters in v1-3, an unweighted
 * mean over every non-zero-width glyph in v4+), so comparing a v4 web font
 * against Arial's legacy value reports Inter as 38% wider than Arial, which it
 * plainly is not. Measuring the glyphs directly avoids the whole problem.
 */
// prettier-ignore
const EN_FREQ = {
  a: 0.0817, b: 0.0150, c: 0.0278, d: 0.0425, e: 0.1270, f: 0.0223, g: 0.0202,
  h: 0.0609, i: 0.0697, j: 0.0015, k: 0.0077, l: 0.0403, m: 0.0241, n: 0.0675,
  o: 0.0751, p: 0.0193, q: 0.0010, r: 0.0599, s: 0.0633, t: 0.0906, u: 0.0276,
  v: 0.0098, w: 0.0236, x: 0.0015, y: 0.0197, z: 0.0007, " ": 0.1818,
};

/** Unicode codepoint -> glyph id, from a cmap format 4 or 12 subtable. */
function readCmap(cmap) {
  const numTables = cmap.readUInt16BE(2);
  let best = null;
  for (let i = 0; i < numTables; i++) {
    const rec = 4 + i * 8;
    const platform = cmap.readUInt16BE(rec);
    const encoding = cmap.readUInt16BE(rec + 2);
    const offset = cmap.readUInt32BE(rec + 4);
    const format = cmap.readUInt16BE(offset);
    // Prefer a full-repertoire (format 12) Unicode subtable, else BMP format 4.
    const unicode =
      (platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0;
    if (!unicode) continue;
    if (format === 12) best = { offset, format };
    else if (format === 4 && !best) best = { offset, format };
  }
  if (!best) throw new Error("no usable cmap subtable");

  const map = new Map();
  if (best.format === 12) {
    const n = cmap.readUInt32BE(best.offset + 12);
    for (let g = 0; g < n; g++) {
      const off = best.offset + 16 + g * 12;
      const start = cmap.readUInt32BE(off);
      const end = cmap.readUInt32BE(off + 4);
      const startGlyph = cmap.readUInt32BE(off + 8);
      // Only ASCII is ever looked up, so skip groups that cannot contain it.
      if (start > 0x7f) continue;
      for (let c = start; c <= Math.min(end, 0x7f); c++) map.set(c, startGlyph + (c - start));
    }
    return map;
  }

  const segX2 = cmap.readUInt16BE(best.offset + 6);
  const endsAt = best.offset + 14;
  const startsAt = endsAt + segX2 + 2;
  const deltasAt = startsAt + segX2;
  const rangesAt = deltasAt + segX2;
  for (let s = 0; s < segX2 / 2; s++) {
    const end = cmap.readUInt16BE(endsAt + s * 2);
    const start = cmap.readUInt16BE(startsAt + s * 2);
    const delta = cmap.readInt16BE(deltasAt + s * 2);
    const rangeOffset = cmap.readUInt16BE(rangesAt + s * 2);
    if (start > 0x7f) continue;
    for (let c = start; c <= Math.min(end, 0x7f); c++) {
      let gid;
      if (rangeOffset === 0) gid = (c + delta) & 0xffff;
      else {
        const at = rangesAt + s * 2 + rangeOffset + (c - start) * 2;
        gid = cmap.readUInt16BE(at);
        if (gid !== 0) gid = (gid + delta) & 0xffff;
      }
      if (gid) map.set(c, gid);
    }
  }
  return map;
}

/**
 * Advance width of a glyph, in font units.
 *
 * Plain hmtx interleaves advance and left side bearing as 2+2 bytes per entry.
 * WOFF2's hmtx transform drops the side bearings and writes a 1-byte flags
 * header followed by a packed array of advances, so the stride and base differ.
 */
function advanceWidth(hmtx, numberOfHMetrics, gid) {
  // Glyphs past numberOfHMetrics all share the last entry's advance.
  const i = Math.min(gid, numberOfHMetrics - 1);
  return hmtx.woff2Transformed ? hmtx.readUInt16BE(1 + i * 2) : hmtx.readUInt16BE(i * 4);
}

/** Metrics from either a WOFF2 or a raw sfnt. */
function readMetrics(buf) {
  const sig = buf.toString("ascii", 0, 4);
  const tables = sig === "wOF2" ? woff2Tables(buf) : sfntTables(buf);
  const { head, hhea, hmtx, cmap } = tables;
  if (!head || !hhea || !hmtx || !cmap) throw new Error("missing head/hhea/hmtx/cmap");

  const unitsPerEm = head.readUInt16BE(18);
  const numberOfHMetrics = hhea.readUInt16BE(34);
  const glyphs = readCmap(cmap);

  // Average advance width over English prose, as a fraction of the em.
  let width = 0;
  let weight = 0;
  for (const [ch, freq] of Object.entries(EN_FREQ)) {
    const gid = glyphs.get(ch.codePointAt(0));
    if (gid === undefined) continue;
    width += advanceWidth(hmtx, numberOfHMetrics, gid) * freq;
    weight += freq;
  }
  if (weight === 0) throw new Error("no sample glyphs found");

  return {
    unitsPerEm,
    ascent: hhea.readInt16BE(4),
    descent: hhea.readInt16BE(6),
    lineGap: hhea.readInt16BE(8),
    avgWidth: width / weight / unitsPerEm,
  };
}

/**
 * CSS overrides that make `fallback` occupy the same space as `web`.
 *
 * size-adjust scales the fallback so its average glyph width matches; the
 * ascent/descent/line-gap overrides are then expressed relative to that scaled
 * em, so a line of fallback text has the same height as a line of the web font.
 */
function overrides(web, fallback) {
  const sizeAdjust = web.avgWidth / fallback.avgWidth;
  const pct = (n) => `${(n * 100).toFixed(2)}%`;
  return {
    sizeAdjust: pct(sizeAdjust),
    ascent: pct(web.ascent / web.unitsPerEm / sizeAdjust),
    descent: pct(Math.abs(web.descent) / web.unitsPerEm / sizeAdjust),
    lineGap: pct(web.lineGap / web.unitsPerEm / sizeAdjust),
  };
}

// -------------------------------------------------------------------- main --

const slug = (s) => s.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();

const woff2Css = await getText(GOOGLE_CSS, MODERN_UA);

const faces = parseFaces(woff2Css).filter((f) => SUBSETS.has(f.subset));
if (faces.length === 0) throw new Error("no faces matched the requested subsets");

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });

const rules = [];
const preloadHrefs = [];
const written = new Map(); // content hash -> href
const metricSource = new Map(); // family -> a downloaded woff2 to read metrics from
let total = 0;

for (const f of faces) {
  const buf = await getBuffer(f.url);
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 8);

  // Metrics must come from the `latin` subset: it is the one that actually
  // contains a-z, and the average advance width is measured over those. Reading
  // them from `latin-ext` silently averages over a handful of accented glyphs
  // and produces a wildly wrong size-adjust.
  if (f.subset === "latin" && !metricSource.has(f.family)) metricSource.set(f.family, buf);

  // Inter ships as one variable file that Google serves for every requested
  // weight, so four of these downloads are byte-identical. Write each distinct
  // file once and point every rule at it: the browser then fetches one file for
  // all four weights instead of four copies of the same bytes.
  let href = written.get(hash);
  if (!href) {
    const file = `${slug(f.family)}-${f.subset}.${hash}.woff2`;
    await fs.writeFile(path.join(OUT_DIR, file), buf);
    href = `/fonts/${file}`;
    written.set(hash, href);
    total += buf.length;
  }
  rules.push(
    `@font-face {\n` +
      `  font-family: "${f.family}";\n` +
      `  font-style: ${f.style};\n` +
      `  font-weight: ${f.weight};\n` +
      `  font-display: swap;\n` +
      `  src: url("${href}") format("woff2");\n` +
      `  unicode-range: ${f.unicodeRange};\n` +
      `}`,
  );

  if (PRELOAD.some((p) => p.family === f.family && p.weight === f.weight && p.subset === f.subset)) {
    preloadHrefs.push(href);
  }
  console.log(`  ${f.family} ${f.weight} ${f.subset.padEnd(10)} ${(buf.length / 1024).toFixed(1)} KB`);
}

// Fallback faces, one per family, sized from the real font tables.
const fallbackMetrics = readMetrics(await fs.readFile(FALLBACK.file));
const fallbackRules = [];

for (const [family, buf] of metricSource) {
  const web = readMetrics(buf);
  const o = overrides(web, fallbackMetrics);
  const ratio = web.avgWidth / fallbackMetrics.avgWidth;
  if (ratio < 0.8 || ratio > 1.25) {
    throw new Error(
      `implausible size-adjust for ${family} (${(ratio * 100).toFixed(1)}%) — the` +
        ` sample glyphs were probably missing from the subset metrics came from`,
    );
  }
  fallbackRules.push(
    `@font-face {\n` +
      `  font-family: "${family} Fallback";\n` +
      `  src: local("Arial"), local("Helvetica"), local("Liberation Sans");\n` +
      `  size-adjust: ${o.sizeAdjust};\n` +
      `  ascent-override: ${o.ascent};\n` +
      `  descent-override: ${o.descent};\n` +
      `  line-gap-override: ${o.lineGap};\n` +
      `}`,
  );
  console.log(
    `  fallback for ${family}: size-adjust ${o.sizeAdjust}, ascent ${o.ascent}, descent ${o.descent}`,
  );
}

const css = `/* GENERATED by scripts/fetch-fonts.mjs — do not edit by hand.
 *
 * Self-hosted replacements for the render-blocking fonts.googleapis.com
 * stylesheet. Same families, same weights, same unicode-ranges, so the browser
 * downloads exactly the subsets it would have before.
 *
 * The "… Fallback" faces below are metric-matched to their web font: size-adjust
 * and the ascent/descent/line-gap overrides are computed from the real font
 * tables, so text laid out in the fallback occupies the same space and swapping
 * in the web font does not shift the page.
 */

${rules.join("\n\n")}

${fallbackRules.join("\n\n")}
`;

await fs.mkdir(path.dirname(CSS_OUT), { recursive: true });
await fs.writeFile(CSS_OUT, css);

const ts = `// GENERATED by scripts/fetch-fonts.mjs — do not edit by hand.

/** Above-the-fold faces worth a <link rel="preload">. */
export const FONT_PRELOADS: string[] = ${JSON.stringify(preloadHrefs, null, 2)};
`;
await fs.mkdir(path.dirname(TS_OUT), { recursive: true });
await fs.writeFile(TS_OUT, ts);

console.log(
  `\n${faces.length} faces, ${(total / 1024).toFixed(0)} KB total, ${preloadHrefs.length} preloaded.`,
);
