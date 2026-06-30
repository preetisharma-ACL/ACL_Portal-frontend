import { Show, createEffect } from "solid-js";
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
 */
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

  return (
    <Show when={loaderId()}>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${loaderId()}`} />
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
