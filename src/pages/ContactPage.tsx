import { For, type JSX } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import { breadcrumbLd } from "~/lib/jsonld";
import { SITE_NAME, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_TEL } from "~/lib/config";

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Contact Us", path: "/contact" },
];

function Icon(props: { name: "mail" | "phone" | "building" | "clock" | "pin" }) {
  const cls = "h-6 w-6";
  switch (props.name) {
    case "mail":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
        </svg>
      );
    case "building":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={cls} aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
  }
}

const CONTACTS: { name: "mail" | "phone" | "building" | "clock"; label: string; value: string; href?: string }[] = [
  { name: "mail", label: "Email us", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { name: "phone", label: "Call us", value: CONTACT_PHONE, href: `tel:${CONTACT_PHONE_TEL}` },
  { name: "building", label: "Operated by", value: "AAJneeti Connect Ltd." },
  { name: "clock", label: "Response time", value: "Within 24 to 48 hours" },
];

export default function ContactPage() {
  return (
    <>
      <Seo
        title="Contact Us"
        description={`Get in touch with ${SITE_NAME}, operated by AAJneeti Connect Ltd. Email us or find us on the map.`}
        canonical="/contact"
        jsonLd={breadcrumbLd(crumbs)}
      />

      {/* Intro */}
      <section class="relative overflow-hidden bg-gradient-to-br from-accent-50 via-[var(--color-surface)] to-primary-50">
        <div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary-100/60 blur-3xl" />
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />
        <div class="container-x relative z-10 py-12 md:py-16">
          <Breadcrumbs crumbs={crumbs} />
          <span class="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">
            <span aria-hidden="true" class="h-px w-7 bg-primary-500" />
            Contact Us
          </span>
          <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-accent-600 md:text-5xl">
            Get in touch
          </h1>
          <p class="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink)]/75 md:text-lg">
            Questions, feedback or a partnership enquiry? We would love to hear from you. Reach us by
            email or find us on the map below.
          </p>
        </div>
      </section>

      {/* Contact details + map */}
      <section class="container-x py-10 md:py-14">
        <div class="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          {/* Contact cards */}
          <div class="space-y-4">
            <For each={CONTACTS}>
              {(c) => (
                <div class="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-50 text-accent-600">
                    <Icon name={c.name} />
                  </span>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      {c.label}
                    </p>
                    {c.href ? (
                      <a href={c.href} class="mt-0.5 block break-words font-semibold text-primary-700 hover:underline">
                        {c.value}
                      </a>
                    ) : (
                      <p class="mt-0.5 font-semibold text-[var(--color-ink)]">{c.value}</p>
                    )}
                  </div>
                </div>
              )}
            </For>

            <div class="rounded-[var(--radius-lg)] border border-primary-100 bg-gradient-to-br from-primary-50 to-[var(--color-surface)] p-5">
              <h2 class="font-bold text-[var(--color-ink)]">Looking for admission guidance?</h2>
              <p class="mt-1 text-sm text-[var(--color-muted)]">
                Browse colleges and request free, independent guidance from any college or listing
                page. We do not charge students.
              </p>
            </div>
          </div>

          {/* Embedded map */}
          <div class="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
            <div class="flex items-center gap-2 border-b border-[var(--color-line)] px-5 py-3.5">
              <span class="text-accent-600">
                <Icon name="pin" />
              </span>
              <h2 class="font-bold text-[var(--color-ink)]">Find AAJneeti Connect Ltd.</h2>
            </div>
            <iframe
              title="AAJneeti Connect Limited location"
              src="https://www.google.com/maps?q=AAJneeti%20Connect%20Limited&output=embed"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              class="block h-[22rem] w-full border-0 lg:h-[28rem]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
