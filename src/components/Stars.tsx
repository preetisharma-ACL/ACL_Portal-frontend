import { For, Show } from "solid-js";

/** Read-only star rating display (rounds to the nearest whole star). */
export function StarRating(props: { value: number; class?: string; showValue?: boolean }) {
  const rounded = () => Math.round(props.value || 0);
  return (
    <span class={`inline-flex items-center gap-1 ${props.class ?? ""}`}>
      <span aria-hidden="true" class="text-[var(--color-warning)] leading-none">
        <For each={[1, 2, 3, 4, 5]}>{(i) => <span>{i <= rounded() ? "★" : "☆"}</span>}</For>
      </span>
      <Show when={props.showValue}>
        <span class="text-sm font-semibold text-[var(--color-ink)]">
          {(props.value || 0).toFixed(1)}
        </span>
      </Show>
    </span>
  );
}

/** Interactive 1-5 star picker. */
export function StarPicker(props: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div class="flex items-center gap-2">
      <Show when={props.label}>
        <span class="text-sm text-[var(--color-ink)] min-w-[7.5rem]">{props.label}</span>
      </Show>
      <span class="flex items-center gap-0.5" role="radiogroup" aria-label={props.label ?? "Rating"}>
        <For each={[1, 2, 3, 4, 5]}>
          {(i) => (
            <button
              type="button"
              role="radio"
              aria-checked={props.value === i}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              onClick={() => props.onChange(i)}
              class="text-xl leading-none transition-transform hover:scale-110"
              classList={{
                "text-[var(--color-warning)]": i <= props.value,
                "text-[var(--color-line)] hover:text-[var(--color-warning)]/60": i > props.value,
              }}
            >
              ★
            </button>
          )}
        </For>
      </span>
      <Show when={props.value > 0}>
        <span class="ml-1 text-sm font-semibold text-[var(--color-ink)]">{props.value}/5</span>
      </Show>
    </div>
  );
}
