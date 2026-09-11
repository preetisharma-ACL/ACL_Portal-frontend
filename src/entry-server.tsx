// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { For } from "solid-js";
import { FONT_PRELOADS } from "~/lib/generated/fonts";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta
            name="google-site-verification"
            content="hQaGawxCX_Vy6-kHO0z3ih3wqA6smBoHaOq-EuDtr7Q"
          />
          <link rel="icon" href="/aajneeti-favicon.png" />
          {/*
            Inter and Plus Jakarta Sans are self-hosted (scripts/fetch-fonts.mjs);
            their @font-face rules are bundled into the app stylesheet. What used
            to be here was a render-blocking fonts.googleapis.com stylesheet,
            measured at 750 ms, which only then let the browser start connecting
            to fonts.gstatic.com for the actual .woff2 files.

            The preconnects to both Google Fonts origins went with it: nothing is
            fetched from either any more, so they would open two TLS connections
            the page never uses.

            These two faces render above the fold on every page — Inter 400 for
            body copy, Plus Jakarta Sans 800 for the h1 — so they are preloaded
            rather than waiting to be discovered when the stylesheet parses.
            Everything else is discovered normally.
          */}
          <For each={FONT_PRELOADS}>
            {(href) => (
              <link rel="preload" as="font" type="font/woff2" href={href} crossorigin="anonymous" />
            )}
          </For>
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
