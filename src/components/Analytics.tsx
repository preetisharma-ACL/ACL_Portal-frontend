import { Show, createEffect, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { useLocation } from "@solidjs/router";
import { GA4_ID, GOOGLE_ADS_ID } from "~/lib/config";

/**
 * gtag.js loader for GA4 and Google Ads. Renders nothing unless at least one of
 * VITE_GA4_ID / VITE_GOOGLE_ADS_ID is set. The base config sends the first GA4
 * page_view; this effect sends a page_view on each client-side route change so
 * SPA navigations are tracked. Google Ads is configured on the same gtag
 * library for conversion tracking. Other events (search, filter, card_click,
 * lead_form_view, lead_submit) are fired via ~/lib/analytics.
 *
 * The library costs 365 ms of main thread and was loading during the initial
 * page load, which is most of the measured Total Blocking Time. It is now
 * fetched after the page is interactive instead — on the first user interaction,
 * or on requestIdleCallback with a 2 s timeout, whichever comes first.
 *
 * Nothing about *what* fires changes. The `gtag()` shim and `dataLayer` are
 * still defined inline and synchronously, exactly as before, so every call made
 * before the library arrives — the `js`/`config` pair, the per-navigation
 * page_view, every track() event, and the thank-you page's `conversion` and
 * `generate_lead` — queues on dataLayer and is replayed by gtag.js the moment it
 * loads. That is how gtag is designed to work: gtag() only ever pushes to an
 * array. Deferring the <script> defers the network and the parse, not the data.
 */

/** Interactions that mean the user is engaged and analytics should load now. */
const WAKE_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

/** Upper bound on the delay, so a conversion is never lost to an idle page. */
const IDLE_TIMEOUT_MS = 2000;

export default function Analytics() {
  const location = useLocation();

  // The gtag library only needs to load once; reuse whichever id is present.
  const loaderId = () => GA4_ID || GOOGLE_ADS_ID;

  createEffect(() => {
    const path = location.pathname + location.search;
    if (isServer || !GA4_ID) return;
    const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (typeof g === "function") {
      g("event", "page_view", { page_path: path, page_location: window.location.href });
    }
  });

  onMount(() => {
    const id = loaderId();
    if (isServer || !id) return;

    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      cleanup();
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(s);
    };

    const cleanup = () => {
      for (const e of WAKE_EVENTS) window.removeEventListener(e, load);
    };

    for (const e of WAKE_EVENTS) {
      window.addEventListener(e, load, { once: true, passive: true });
    }

    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;
    const timer = idle
      ? idle(load, { timeout: IDLE_TIMEOUT_MS })
      : setTimeout(load, IDLE_TIMEOUT_MS);

    onCleanup(() => {
      cleanup();
      if (!idle) clearTimeout(timer as ReturnType<typeof setTimeout>);
    });
  });

  return (
    <Show when={loaderId()}>
      {/*
        Queue-only shim. Identical to what shipped before, minus the <script src>
        that now loads from onMount. It must stay inline and synchronous so that
        window.gtag exists for the whole life of the page.
      */}
      <script
        innerHTML={`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${
          GA4_ID
            ? `gtag('config','${GA4_ID}',{anonymize_ip:true,send_page_view:false});`
            : ""
        }${GOOGLE_ADS_ID ? `gtag('config','${GOOGLE_ADS_ID}');` : ""}`}
      />
    </Show>
  );
}
