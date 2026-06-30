import { onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { A } from "@solidjs/router";
import Seo from "~/components/Seo";
import {
  SITE_NAME,
  GOOGLE_ADS_ID,
  GOOGLE_ADS_CONVERSION_LABEL,
} from "~/lib/config";

/**
 * Conversion landing page. Every lead-generation form (guidance, brochure and
 * the site-wide popup) redirects here on a successful submit, so this single
 * URL is the Google Ads conversion trigger.
 *
 * On load it fires:
 *  - a Google Ads `conversion` event to AW-… (with the optional label), and
 *  - a GA4 `generate_lead` event.
 * The page is kept out of search indexes — it is only reached after a submit.
 */
export default function ThankYouPage() {
  onMount(() => {
    if (isServer) return;
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (typeof gtag !== "function") return;

    // Google Ads conversion. With a label set, send to AW-…/label; otherwise
    // send to the account id (a page-load conversion on this URL still counts).
    const sendTo = GOOGLE_ADS_CONVERSION_LABEL
      ? `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`
      : GOOGLE_ADS_ID;
    gtag("event", "conversion", { send_to: sendTo });

    // GA4 lead conversion (separate property; harmless if GA4 is disabled).
    gtag("event", "generate_lead", { event_category: "lead", event_label: "form_submit" });
  });

  return (
    <>
      <Seo
        title="Thank you"
        description={`Thank you for contacting ${SITE_NAME}. Our team will reach out with guidance relevant to your enquiry.`}
        canonical="/thank-you"
        noindex
      />

      <section class="relative overflow-hidden bg-gradient-to-br from-primary-50 via-[var(--color-surface)] to-accent-50">
        <div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary-100/60 blur-3xl" />
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />

        <div class="container-x relative z-10 flex min-h-[60vh] flex-col items-center justify-center py-16 text-center md:py-24">
          <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] ring-8 ring-[var(--color-success)]/5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h1 class="mt-6 text-4xl font-extrabold tracking-tight text-accent-600 md:text-5xl">
            Thank you!
          </h1>
          <p class="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink)]/75 md:text-lg">
            Your request has been received. Our team will reach out shortly with free, independent
            guidance relevant to your enquiry. No spam, ever.
          </p>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <A
              href="/"
              class="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 px-6 py-3 text-base font-bold text-white transition-all duration-150 hover:-translate-y-0.5 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800"
            >
              Back to home
            </A>
            <A
              href="/search"
              class="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border-2 border-[var(--color-line)] px-6 py-3 text-base font-semibold text-[var(--color-ink)] transition-colors hover:border-primary-300 hover:text-primary-700"
            >
              Explore colleges
            </A>
          </div>
        </div>
      </section>
    </>
  );
}
