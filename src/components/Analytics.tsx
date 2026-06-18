import { Show } from "solid-js";
import { GA4_ID } from "~/lib/config";

/**
 * GA4 loader. Renders nothing unless VITE_GA4_ID is set. Event tracking helpers
 * live in ~/lib/analytics and are wired into search, filters and the lead form.
 */
export default function Analytics() {
  return (
    <Show when={GA4_ID}>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />
      <script
        innerHTML={`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}',{anonymize_ip:true});`}
      />
    </Show>
  );
}
