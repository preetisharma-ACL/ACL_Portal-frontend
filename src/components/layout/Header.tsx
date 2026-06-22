import { A, createAsync } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
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

export default function Header() {
  const [open, setOpen] = createSignal(false);
  // Nav derives from the live streams taxonomy so the links always match the
  // slugs the backend actually serves (and the mock in dev).
  const streams = createAsync(() => streamsQuery());
  const navStreams = () => (streams() ?? []).slice(0, 5);

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
            <Show when={streams()}>
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
            </Show>
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
