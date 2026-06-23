import { Show } from "solid-js";
import {
  isCompareFull,
  isInCompare,
  toggleCompare,
  type CompareItem,
} from "~/lib/compareStore";

/**
 * "Add to compare" toggle for a college. Reflects selection state, and is
 * disabled (with a hint) when the compare set is full and this one is not in it.
 */
export default function CompareToggle(props: {
  college: CompareItem;
  class?: string;
  variant?: "card" | "button";
}) {
  const selected = () => isInCompare(props.college.id);
  const blocked = () => !selected() && isCompareFull();

  return (
    <button
      type="button"
      aria-pressed={selected()}
      disabled={blocked()}
      title={blocked() ? "You can compare up to 4 colleges" : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(props.college);
      }}
      class={`inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        props.variant === "button" ? "px-4 py-2.5" : "px-3 py-1.5"
      } ${
        selected()
          ? "border-primary-600 bg-primary-600 text-white hover:bg-primary-700"
          : "border-[var(--color-line)] text-primary-700 hover:border-primary-300 hover:bg-primary-50"
      } ${props.class ?? ""}`}
    >
      <span aria-hidden="true" class="text-base leading-none">
        {selected() ? "✓" : "+"}
      </span>
      <Show when={selected()} fallback={<span>Add to compare</span>}>
        <span>Added to compare</span>
      </Show>
    </button>
  );
}
