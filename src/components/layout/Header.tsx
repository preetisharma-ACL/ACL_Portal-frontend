import { A, useNavigate } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import { SITE_NAME } from "~/lib/config";

const NAV = [
  { label: "MBA", href: "/mba" },
  { label: "Engineering", href: "/engineering" },
  { label: "Medical", href: "/medical" },
  { label: "Law", href: "/law" },
  { label: "Exams", href: "/mba/cat-exam" },
];

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = createSignal(false);
  let input: HTMLInputElement | undefined;

  function onSearch(e: SubmitEvent) {
    e.preventDefault();
    const q = input?.value.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header class="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-line)]">
      <div class="container-x flex items-center gap-4 h-16">
        <A href="/" class="flex items-center gap-2 shrink-0" aria-label={`${SITE_NAME} home`}>
          <span class="grid place-items-center w-8 h-8 rounded-[var(--radius-md)] bg-primary-600 text-white font-bold">
            A
          </span>
          <span class="font-bold text-primary-900 hidden sm:inline">{SITE_NAME}</span>
        </A>

        <form
          role="search"
          onSubmit={onSearch}
          class="flex-1 max-w-xl hidden md:flex items-center bg-[var(--color-canvas)] border border-[var(--color-line)] rounded-[var(--radius-md)] px-3"
        >
          <span aria-hidden="true" class="text-[var(--color-muted)]">
            ⌕
          </span>
          <input
            ref={input}
            name="q"
            type="search"
            placeholder="Search colleges, courses or exams"
            aria-label="Search colleges, courses or exams"
            class="w-full bg-transparent py-2.5 px-2 outline-none text-sm"
          />
        </form>

        <nav class="hidden lg:flex items-center gap-1 text-sm" aria-label="Primary">
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
        <div class="container-x py-3 space-y-3">
          <form role="search" onSubmit={onSearch} class="flex items-center bg-[var(--color-canvas)] border border-[var(--color-line)] rounded-[var(--radius-md)] px-3">
            <input
              name="q"
              type="search"
              placeholder="Search colleges, courses or exams"
              aria-label="Search"
              class="w-full bg-transparent py-2.5 px-1 outline-none text-sm"
            />
          </form>
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
          </nav>
        </div>
      </div>
    </header>
  );
}
