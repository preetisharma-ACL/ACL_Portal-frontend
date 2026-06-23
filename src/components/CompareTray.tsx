import { A, useLocation } from "@solidjs/router";
import { For, Show, onMount } from "solid-js";
import {
  clearCompare,
  compareCount,
  items,
  loadCompare,
  removeFromCompare,
} from "~/lib/compareStore";
import CollegeLogo from "./CollegeLogo";

/**
 * Sticky bottom tray that appears once 1+ college is selected for comparison.
 * Persists across navigation (module store + localStorage). Compare is enabled
 * at 2+. Hidden on the compare page itself.
 */
export default function CompareTray() {
  const location = useLocation();
  onMount(loadCompare);

  const compareHref = () => `/compare?ids=${items().map((c) => c.id).join(",")}`;
  const onComparePage = () => location.pathname === "/compare";

  return (
    <Show when={compareCount() > 0 && !onComparePage()}>
      <div class="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-surface)]/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur">
        <div class="container-x flex items-center gap-3 py-3">
          <div class="hidden shrink-0 sm:block">
            <p class="text-sm font-bold">Compare</p>
            <p class="text-xs text-[var(--color-muted)]">{compareCount()} of 4 selected</p>
          </div>

          {/* Selected chips */}
          <ul class="flex flex-1 items-center gap-2 overflow-x-auto py-0.5">
            <For each={items()}>
              {(c) => (
                <li class="flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] py-1 pl-1.5 pr-2">
                  <CollegeLogo
                    name={c.name}
                    logo={c.logo ?? ""}
                    id={c.id}
                    class="h-6 w-6 rounded-full text-[10px]"
                  />
                  <span class="max-w-[8rem] truncate text-xs font-medium">{c.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${c.name} from compare`}
                    onClick={() => removeFromCompare(c.id)}
                    class="grid h-4 w-4 place-items-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-line)] hover:text-[var(--color-ink)]"
                  >
                    ×
                  </button>
                </li>
              )}
            </For>
          </ul>

          <button
            type="button"
            onClick={clearCompare}
            class="hidden shrink-0 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] sm:block"
          >
            Clear
          </button>

          <A
            href={compareHref()}
            aria-disabled={compareCount() < 2}
            onClick={(e) => compareCount() < 2 && e.preventDefault()}
            class={`shrink-0 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold transition-colors ${
              compareCount() >= 2
                ? "bg-accent-500 text-white hover:bg-accent-400"
                : "cursor-not-allowed bg-[var(--color-line)] text-[var(--color-muted)]"
            }`}
          >
            Compare{compareCount() >= 2 ? ` (${compareCount()})` : ""}
          </A>
        </div>
        <Show when={compareCount() < 2}>
          <p class="container-x pb-2 text-center text-xs text-[var(--color-muted)] sm:text-left">
            Add at least one more college to compare.
          </p>
        </Show>
      </div>
    </Show>
  );
}
