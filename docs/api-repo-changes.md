# Changes that belong in the Payload API repo, not here

Two items from the Core Web Vitals work cannot be made in this repository. Both
concern `api.edu.aajneeti.social` and its `/media/**` responses.

Verify the exact option names against the Payload major version the API is on —
the shapes below differ between Payload 2 (Express) and Payload 3 (Next).

---

## 1. Payload media has no `Cache-Control` at all — 6,403 KiB re-downloaded every visit

**Required.** This is the single largest remaining item after the frontend work.

Lighthouse reports a cache TTL of "None" for every `/media/colleges/media/*`
response, covering 6,403 KiB. Every repeat visitor re-downloads all of it.

Media filenames are content-addressed by Payload (it appends a suffix on
collision — `clgLogo_2EJeHCf.webp`, `images_fshfNfh.jpg`), so a URL's bytes do
not change once written. That makes an immutable TTL safe:

```
Cache-Control: public, max-age=31536000, immutable
```

Where to set it depends on how media is served:

- **Payload's own static handler.** In Payload 2 the upload config forwards
  options to `express.static`, so a `setHeaders` callback applies the header.
  In Payload 3 the equivalent lives on the upload config's static-headers
  option, or in the Next route handler that serves the upload directory.

  ```ts
  // Payload 2 shape — check the equivalent for your version.
  upload: {
    staticDir: path.resolve(__dirname, "../media"),
    staticOptions: {
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      },
    },
  },
  ```

- **An S3/R2 adapter.** Set `CacheControl` on the put, and backfill the existing
  objects with a copy-in-place that rewrites metadata (`aws s3 cp --recursive
  --metadata-directive REPLACE --cache-control ...`, or the R2 equivalent).

- **A CDN or reverse proxy in front.** Add the header there. It is the quickest
  route if the API is already behind one.

**Caveat that makes this safe:** the header must go on `/media/**` only. Do not
let it reach the Payload admin, the REST/GraphQL API, `robots.txt` or the
sitemaps — those are rewritten through this frontend and must stay uncached.

**Verify with:** `curl -sI https://api.edu.aajneeti.social/media/colleges/media/Institute_bird_eye_view2.jpg | grep -i cache-control`

---

## 2. Resized media derivatives — optional, and currently handled at the edge

**Not required.** The frontend now routes every remote media URL through Vercel
Image Optimization (`/_vercel/image`), configured in `app.config.ts` and
mirrored in `vercel.json`. That resizes and re-encodes to AVIF/WebP at the edge
with no change to the API, no re-upload, and no backfill — which is why it was
chosen over generating derivatives in Payload.

The trade-off worth knowing: Vercel Image Optimization is metered per source
image transformed. The site has a few thousand media records, so it should sit
inside the plan's allowance, but it is a cost line that did not exist before.

If that cost is unwelcome, or you want derivatives that survive a move off
Vercel, generate them in Payload instead. That is a bigger change, and it does
**not** fix existing records on its own — `imageSizes` only runs on upload, so
everything already in the database keeps pointing at its original.

### If you take the Payload route

```ts
// collections/Media.ts
upload: {
  staticDir: path.resolve(__dirname, "../media"),
  formatOptions: { format: "webp", options: { quality: 75 } },
  imageSizes: [
    { name: "thumbnail", width: 400, withoutEnlargement: true },
    { name: "card", width: 800, withoutEnlargement: true },
    { name: "hero", width: 1600, withoutEnlargement: true },
  ],
},
```

Then surface the generated size URLs in the API response (the `sizes` object on
each upload doc) so this frontend can consume them, and point
`src/lib/image.ts` at those instead of `/_vercel/image`.

### Backfill for existing records

`imageSizes` is applied at upload time only. Without this, every record created
before the change keeps serving its original — including
`Institute_bird_eye_view2.jpg` at 5472x2437 / 4,607 KB in a 501x277 card, which
is the specific file Lighthouse named.

```ts
/**
 * Regenerate derivatives for media uploaded before imageSizes was configured.
 *
 *   npx tsx scripts/backfill-media-sizes.ts            # dry run
 *   npx tsx scripts/backfill-media-sizes.ts --apply
 *
 * Re-saving a media doc with an unchanged file makes Payload re-run its upload
 * hooks, which is what regenerates the sizes. Run it against a database copy
 * first: it rewrites every media document.
 */
import payload from "payload";

const APPLY = process.argv.includes("--apply");
const BATCH = 25;

async function main() {
  await payload.init({ secret: process.env.PAYLOAD_SECRET!, local: true });

  let page = 1;
  let processed = 0;
  let regenerated = 0;
  let failed = 0;

  for (;;) {
    const { docs, hasNextPage } = await payload.find({
      collection: "media",
      limit: BATCH,
      page,
      depth: 0,
    });
    if (docs.length === 0) break;

    for (const doc of docs as Array<{ id: string; filename?: string; sizes?: object }>) {
      processed++;
      // Already has derivatives: nothing to do.
      const sizes = doc.sizes ?? {};
      if (Object.values(sizes).some((s: any) => s?.filename)) continue;

      if (!APPLY) {
        console.log(`would regenerate: ${doc.filename ?? doc.id}`);
        regenerated++;
        continue;
      }

      try {
        // No data change; the point is to re-trigger the upload hooks.
        await payload.update({
          collection: "media",
          id: doc.id,
          data: {},
          overrideAccess: true,
          // Some versions need the file re-read explicitly; if sizes still come
          // back empty, pass `filePath` pointing at the file in staticDir.
        });
        regenerated++;
      } catch (err) {
        failed++;
        console.error(`failed: ${doc.filename ?? doc.id}`, err);
      }
    }

    if (!hasNextPage) break;
    page++;
  }

  console.log(
    `${APPLY ? "regenerated" : "would regenerate"} ${regenerated} of ${processed} media docs` +
      (failed ? `, ${failed} failed` : ""),
  );
  process.exit(failed ? 1 : 0);
}

void main();
```

After the backfill, confirm a known-bad record actually has derivatives:

```bash
curl -s "https://api.edu.aajneeti.social/api/media?where[filename][equals]=Institute_bird_eye_view2.jpg" \
  | jq '.docs[0].sizes'
```

---

## What is already done on the frontend

For context, so these two items are not duplicated:

- Every bundled `/public` image is re-encoded to responsive AVIF/WebP/JPEG at
  build time (`scripts/optimize-images.mjs`) and served with a one-year
  immutable TTL. First-party image bytes on the homepage went from 8,795 KB to
  158 KB.
- Every remote media URL is emitted with `srcset`/`sizes` capped at the widest
  size the layout can display, through `/_vercel/image`.
- `Cache-Control` for everything this project serves — `/opt`, `/fonts` and the
  rest of `/public` — is set in `app.config.ts` (and mirrored in `vercel.json`).
  Only the API's own `/media/**` responses are still uncached.
