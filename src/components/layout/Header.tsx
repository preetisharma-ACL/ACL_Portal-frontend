import { A, createAsync } from "@solidjs/router";
import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import { Portal, isServer } from "solid-js/web";
import { SITE_NAME } from "~/lib/config";
import { streamsQuery } from "~/lib/queries";
import AccountMenu from "~/components/AccountMenu";
import StreamIcon from "~/components/StreamIcon";

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

function NewsIcon(props: { class?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class={props.class ?? "w-5 h-5"} aria-hidden="true">
      <path d="M4 22h13a2 2 0 0 0 2-2V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v16a2 2 0 0 1-2 2 2 2 0 0 1-2-2V9a1 1 0 0 1 1-1h2" />
      <path d="M8 7h7M8 11h7M8 15h4" />
    </svg>
  );
}

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/**
 * Default nav, used during SSR (before the streams resource resolves) and as a
 * fail-safe if the streams fetch errors or returns empty, so core navigation
 * can never disappear. Mirrors the streams the backend serves.
 */
const DEFAULT_NAV: { name: string; slug: string }[] = [
  { name: "Pharmacy", slug: "pharmacy" },
  { name: "University", slug: "university" },
  { name: "Engineering", slug: "engineering" },
  { name: "Management", slug: "management" },
  { name: "Medical", slug: "medical" },
  { name: "Law", slug: "law" },
];

export default function Header() {
  const [open, setOpen] = createSignal(false);
  const close = () => setOpen(false);
  // Nav derives from the live streams taxonomy so the links always match the
  // slugs the backend serves; falls back to DEFAULT_NAV so it is never empty.
  const streams = createAsync(() => streamsQuery(), { deferStream: true });
  const navStreams = () => {
    const s = streams();
    return s && s.length ? s.slice(0, 6).map((x) => ({ name: x.name, slug: x.slug })) : DEFAULT_NAV;
  };

  // Lock body scroll + close on Escape while the drawer is open.
  createEffect(() => {
    if (isServer) return;
    if (open()) {
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
      window.addEventListener("keydown", onKey);
      onCleanup(() => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      });
    }
  });

  const drawerLink =
    "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2.5 font-medium text-[var(--color-ink)] transition-colors hover:bg-primary-50 hover:text-primary-700";
  const drawerChip =
    "grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary-50 text-primary-600";

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
          <span class="ml-1">
            <AccountMenu />
          </span>
        </nav>

        <button
          type="button"
          class="lg:hidden ml-auto grid h-10 w-10 place-items-center rounded-[var(--radius-md)] text-[var(--color-ink)] hover:bg-primary-50"
          aria-label="Open menu"
          aria-expanded={open()}
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-6 w-6" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar drawer */}
      <Show when={open()}>
        <Portal>
          <div class="lg:hidden">
            <div
              class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-backdrop-in"
              aria-hidden="true"
              onClick={close}
            />
            <aside
              class="fixed inset-y-0 right-0 z-50 flex w-[84%] max-w-xs flex-col bg-[var(--color-surface)] shadow-2xl animate-drawer-in"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              {/* Brand accent + header */}
              <div class="h-1 w-full shrink-0 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-700" />
              <div class="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3.5">
                <img src="/acl-logo.png" alt={SITE_NAME} class="h-10 w-auto" />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  class="grid h-9 w-9 place-items-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-5 w-5" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Nav */}
              <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
                <p class="px-2.5 pb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                  Explore streams
                </p>
                <For each={navStreams()}>
                  {(s) => (
                    <A href={`/${s.slug}`} class={drawerLink} onClick={close}>
                      <span class={drawerChip}>
                        <StreamIcon slug={s.slug} class="text-lg" />
                      </span>
                      <span class="flex-1">{s.name}</span>
                      <ChevronRight />
                    </A>
                  )}
                </For>

                <p class="px-2.5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                  More
                </p>
                <A href="/articles" class={drawerLink} onClick={close}>
                  <span class={drawerChip}><NewsIcon /></span>
                  <span class="flex-1">News &amp; Guides</span>
                  <ChevronRight />
                </A>
                <A href="/search" class={drawerLink} onClick={close}>
                  <span class={drawerChip}><SearchIcon class="h-5 w-5" /></span>
                  <span class="flex-1">Search</span>
                  <ChevronRight />
                </A>
              </nav>

              {/* Footer: account / login */}
              <div class="border-t border-[var(--color-line)] p-4" onClick={close}>
                <AccountMenu />
              </div>
            </aside>
          </div>
        </Portal>
      </Show>
    </header>
  );
}
