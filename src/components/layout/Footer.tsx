import { A } from "@solidjs/router";
import { For } from "solid-js";
import { OPERATOR_DISCLOSURE, SITE_NAME } from "~/lib/config";

const STREAMS = [
  { label: "MBA Colleges", href: "/mba/colleges/mba-colleges-varanasi" },
  { label: "Engineering Colleges", href: "/engineering/colleges/engineering-colleges-lucknow" },
  { label: "Medical Colleges", href: "/medical/colleges/medical-colleges-delhi-ncr" },
  { label: "Law Colleges", href: "/law/colleges/law-colleges-noida" },
];

const RESOURCES = [
  { label: "News & Guides", href: "/articles" },
  { label: "MBA / PGDM Course", href: "/mba-pgdm-course" },
  { label: "CAT Exam", href: "/mba/cat-exam" },
  { label: "Search", href: "/search" },
];

const LEGAL = [
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclosure", href: "/disclosure" },
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
          </div>
          <Column title="Top Colleges" links={STREAMS} />
          <Column title="Resources" links={RESOURCES} />
          <Column title="Company" links={LEGAL} />
        </div>

        <div class="mt-10 pt-6 border-t border-white/15 text-sm text-white/60 space-y-2">
          {/* Compliance item 5: AAJneeti-operated disclosure in the footer. */}
          <p>{OPERATOR_DISCLOSURE}</p>
          <p>© 2026 AAJneeti Connect Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
