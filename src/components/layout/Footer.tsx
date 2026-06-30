import { A } from "@solidjs/router";
import { For } from "solid-js";
import {
  COMPLIANCE_DISCLAIMER,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  SITE_NAME,
} from "~/lib/config";

const STREAMS = [
  { label: "MBA Colleges", href: "/mba/colleges/mba-colleges-varanasi" },
  { label: "Engineering Colleges", href: "/engineering/colleges/engineering-colleges-lucknow" },
  { label: "Medical Colleges", href: "/medical/colleges/medical-colleges-delhi-ncr" },
  { label: "Law Colleges", href: "/law/colleges/law-colleges-noida" },
];

const RESOURCES = [
  { label: "News & Guides", href: "/articles" },
  { label: "MBA Course", href: "/mba-course" },
  { label: "CAT Exam", href: "/mba/cat-exam" },
  { label: "Search", href: "/search" },
];

const LEGAL = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];

function Column(props: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 class="text-sm font-semibold text-white/90 mb-3">{props.title}</h3>
      <ul class="space-y-2 text-sm text-white/70">
        <For each={props.links}>
          {(l) => (
            <li>
              <A href={l.href} class="hover:text-white hover:underline">
                {l.label}
              </A>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer class="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white mt-16">
      <div class="container-x py-12">
        <div class="grid gap-10 md:grid-cols-4">
          <div>
            <div class="mb-3">
              <span class="inline-flex  py-2">
                <img src="/V2-aajneeti-logo.png" alt={SITE_NAME} class="h-14 w-auto" />
              </span>
            </div>
            <p class="text-sm text-white/70">
              Independent discovery for colleges, courses and exams. Compare and decide with
              clear, comparable information.
            </p>
            <div class="mt-4 space-y-1.5 text-sm">
              <a
                href={`tel:${CONTACT_PHONE_TEL}`}
                class="flex items-center gap-2 text-white/80 hover:text-white hover:underline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
                {CONTACT_PHONE}
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                class="flex items-center gap-2 text-white/80 hover:text-white hover:underline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
          <Column title="Top Colleges" links={STREAMS} />
          <Column title="Resources" links={RESOURCES} />
          <Column title="Company" links={LEGAL} />
        </div>

        <div class="mt-10 pt-6 border-t border-white/15 text-sm text-white/60 space-y-2">
          {/* Site-wide compliance disclaimer (Google Ads requirement). */}
          <p>{COMPLIANCE_DISCLAIMER}</p>
          <p>© 2026 AAJneeti Connect Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
