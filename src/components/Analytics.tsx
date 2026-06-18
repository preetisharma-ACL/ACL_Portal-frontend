import { Show, createEffect } from "solid-js";
import { isServer } from "solid-js/web";
import { useLocation } from "@solidjs/router";
import { GA4_ID } from "~/lib/config";

/**
 * GA4 loader. Renders nothing unless VITE_GA4_ID is set. The base config sends
 * the first page_view; this effect sends a page_view on each client-side route
 * change so SPA navigations are tracked. Other events (search, filter,
 * card_click, lead_form_view, lead_submit) are fired via ~/lib/analytics.
 */
export default function Analytics() {
  const location = useLocation();

  createEffect(() => {
    const path = location.pathname + location.search;
    if (isServer || !GA4_ID) return;
    const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (typeof g === "function") {
      g("event", "page_view", { page_path: path, page_location: window.location.href });
    }
  });

  return (
    <Show when={GA4_ID}>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} />
      <script
        innerHTML={`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}',{anonymize_ip:true,send_page_view:false});`}
      />
    </Show>
  );
}
