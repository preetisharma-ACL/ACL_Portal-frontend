import { For, Show } from "solid-js";
import type { Faq as FaqItem } from "~/lib/types";

/**
 * FAQ accordion. Built on native <details>/<summary> so every question and
 * answer is in the server-rendered HTML and works with JavaScript disabled.
 * Pair with faqLd() for the matching FAQPage schema.
 */
export default function Faq(props: { items: FaqItem[]; heading?: string }) {
  return (
    <Show when={props.items.length}>
      <div>
        <Show when={props.heading !== ""}>
          <h2 class="text-2xl font-bold mb-5">
            {props.heading ?? "Frequently asked questions"}
          </h2>
        </Show>
        <div class="space-y-3">
          <For each={props.items}>
            {(f) => (
              <details class="group rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)]">
                <summary class="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 font-medium list-none">
                  <span>{f.q}</span>
                  <span
                    aria-hidden="true"
                    class="text-[var(--color-muted)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div class="px-4 pb-4 pt-0 text-[var(--color-ink)]/90">{f.a}</div>
              </details>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
