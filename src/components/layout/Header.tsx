import { A, createAsync } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import { SITE_NAME } from "~/lib/config";
import { streamsQuery } from "~/lib/queries";

function SearchIcon(props: { class?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class ?? "w-4 h-4"}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Default nav, used during SSR (before the streams resource resolves) and as a
 * fail-safe if the streams fetch errors or returns empty, so core navigation
 * can never disappear. Mirrors the streams the backend serves.
 */
const DEFAULT_NAV: { name: string; slug: string }[] = [
  { name: "Engineering", slug: "engineering" },
  { name: "Management", slug: "management" },
  { name: "Medical", slug: "medical" },
  { name: "Law", slug: "law" },
];

// TODO (product decision): the nav shows the real stream name "Management".
// If the team prefers the consumer label "MBA", enable a display-label map
// here (e.g. { management: "MBA" }) applied to the label only; keep the slug
// (/management) unchanged. Flagged for the user, not applied as a guess.
// const NAV_LABELS: Record<string, string> = { management: "MBA" };

export default function Header() {
  const [open, setOpen] = createSignal(false);
  // Nav derives from the live streams taxonomy so the links always match the
  // slugs the backend serves; falls back to DEFAULT_NAV so it is never empty.
  const streams = createAsync(() => streamsQuery());
  const navStreams = () => {
    const s = streams();
    return s && s.length
      ? s.slice(0, 5).map((x) => ({ name: x.name, slug: x.slug }))
      : DEFAULT_NAV;
  };

  return (
    <header class="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-line)]">
      <div class="container-x flex items-center gap-4 h-16">
        <A href="/" class="flex items-center shrink-0" aria-label={`${SITE_NAME} home`}>
          <img src="/acl-logo.png" alt={SITE_NAME} class="h-13 w-auto" />
        </A>

        <nav class="hidden lg:flex items-center gap-1 text-sm ml-auto" aria-label="Primary">
          <For each={navStreams()}>
            {(s) => (
              <A
                href={`/${s.slug}`}
                class="px-3 py-2 rounded-[var(--radius-md)] font-medium hover:bg-primary-50 hover:text-primary-700"
              >
                {s.name}
              </A>
            )}
          </For>
          <A
            href="/articles"
            class="px-3 py-2 rounded-[var(--radius-md)] font-medium hover:bg-primary-50 hover:text-primary-700"
          >
            News &amp; Guides
          </A>
          <A
            href="/search"
            class="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] font-medium bg-primary-50 hover:bg-primary-100 hover:text-primary-700"
          >
            <SearchIcon />
            Search
          </A>
        </nav>

        <button
          type="button"
          class="lg:hidden ml-auto p-2 rounded-[var(--radius-md)] hover:bg-primary-50"
          aria-label="Toggle menu"
          aria-expanded={open()}
          onClick={() => setOpen(!open())}
        >
          <span aria-hidden="true" class="text-xl">
            ☰
          </span>
        </button>
      </div>

      {/* Mobile panel */}
      <div
        class="lg:hidden border-t border-[var(--color-line)] bg-[var(--color-surface)]"
        classList={{ hidden: !open() }}
      >
        <div class="container-x py-3">
          <nav class="grid gap-1" aria-label="Mobile">
            <For each={navStreams()}>
              {(s) => (
                <A
                  href={`/${s.slug}`}
                  class="px-3 py-2 rounded-[var(--radius-md)] font-medium hover:bg-primary-50"
                  onClick={() => setOpen(false)}
                >
                  {s.name}
                </A>
              )}
            </For>
            <A
              href="/articles"
              class="px-3 py-2 rounded-[var(--radius-md)] font-medium hover:bg-primary-50"
              onClick={() => setOpen(false)}
            >
              News &amp; Guides
            </A>
            <A
              href="/search"
              class="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] font-medium hover:bg-primary-50"
              onClick={() => setOpen(false)}
            >
              <SearchIcon />
              Search
            </A>
          </nav>
        </div>
      </div>
    </header>
  );
}
