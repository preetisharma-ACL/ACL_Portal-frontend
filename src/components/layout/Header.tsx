import { A } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import { SITE_NAME } from "~/lib/config";

const NAV = [
  { label: "MBA", href: "/mba" },
  { label: "Engineering", href: "/engineering" },
  { label: "Medical", href: "/medical" },
  { label: "Law", href: "/law" },
  { label: "Exams", href: "/mba/cat-exam" },
];

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

  return (
    <header class="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-line)]">
      <div class="container-x flex items-center gap-4 h-16">
        <A href="/" class="flex items-center shrink-0" aria-label={`${SITE_NAME} home`}>
          <img src="/placeholders/logo.png" alt={SITE_NAME} class="h-9 w-auto" />
        </A>

        <nav class="hidden lg:flex items-center gap-1 text-sm ml-auto" aria-label="Primary">
          <For each={NAV}>
            {(item) => (
              <A
                href={item.href}
                class="px-3 py-2 rounded-[var(--radius-md)] font-medium hover:bg-primary-50 hover:text-primary-700"
              >
                {item.label}
              </A>
            )}
          </For>
          <A
            href="/search"
            class="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] font-medium bg-primary-50  hover:bg-primary-100 hover:text-primary-700"
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
            <For each={NAV}>
              {(item) => (
                <A
                  href={item.href}
                  class="px-3 py-2 rounded-[var(--radius-md)] font-medium hover:bg-primary-50"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </A>
              )}
            </For>
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
