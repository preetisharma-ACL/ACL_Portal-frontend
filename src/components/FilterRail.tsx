import { useSearchParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import type { ListingFilters, FilterOption } from "~/lib/types";
import { track } from "~/lib/analytics";

const FEE_STOPS: FilterOption[] = [
  { value: "", label: "Any" },
  { value: "200000", label: "INR 2L" },
  { value: "500000", label: "INR 5L" },
  { value: "1000000", label: "INR 10L" },
  { value: "2000000", label: "INR 20L" },
];

/**
 * Filter rail. Every change writes to the URL query string via setSearchParams,
 * so filtered states are shareable and re-render from the server loader. Each
 * group is single-select (the backend filters are single-value params); picking
 * the active option again clears it. The "page" param resets on any change.
 */
export default function FilterRail(props: {
  filters: ListingFilters;
  specializations: FilterOption[];
  /** Label for the course/specialisation filter (city mode uses "Course"). */
  specializationLabel?: string;
  /** City name shown as a fixed applied-filter chip. */
  cityName?: string;
}) {
  const [sp, setSp] = useSearchParams();

  function setParam(key: string, value: string) {
    track("filter", { key, value });
    setSp({ [key]: value || undefined, page: undefined });
  }

  function clearAll() {
    setSp({
      course: undefined,
      type: undefined,
      exam: undefined,
      approval: undefined,
      fees_min: undefined,
      fees_max: undefined,
      sort: undefined,
      page: undefined,
    });
  }

  const labelFor = (options: FilterOption[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  // Active filters shown as removable chips at the top.
  const chips = () => {
    const out: { name: string; label: string }[] = [];
    const add = (name: string, options: FilterOption[]) => {
      const v = sp[name] as string;
      if (v) out.push({ name, label: labelFor(options, v) });
    };
    add("course", props.specializations);
    add("type", props.filters.types);
    add("exam", props.filters.exams);
    add("approval", props.filters.approvals);
    return out;
  };

  const Group = (g: { title: string; name: string; options: FilterOption[] }) => {
    const active = () => (sp[g.name] as string) ?? "";
    return (
      <Show when={g.options.length}>
        <details open class="group border-t border-[var(--color-line)] pt-3">
          <summary class="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[var(--color-ink)]">
            {g.title}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-[var(--color-muted)] transition-transform group-open:rotate-180" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div class="no-scrollbar mt-2 max-h-56 space-y-0.5 overflow-y-auto pr-1">
            <For each={g.options}>
              {(o) => {
                const on = () => active() === o.value;
                return (
                  <button
                    type="button"
                    onClick={() => setParam(g.name, on() ? "" : o.value)}
                    class="flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-canvas)]"
                  >
                    <span class="flex min-w-0 items-center gap-2">
                      <span
                        class={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                          on() ? "border-primary-600 bg-primary-600 text-white" : "border-[var(--color-line)]"
                        }`}
                      >
                        <Show when={on()}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </Show>
                      </span>
                      <span class={`truncate ${on() ? "font-semibold text-primary-700" : "text-[var(--color-ink)]/90"}`}>
                        {o.label}
                      </span>
                    </span>
                    <Show when={o.count != null}>
                      <span class="shrink-0 text-xs text-[var(--color-muted)]">{o.count}</span>
                    </Show>
                  </button>
                );
              }}
            </For>
          </div>
        </details>
      </Show>
    );
  };

  const FeeSelect = (p: { label: string; name: string }) => (
    <label class="block">
      <span class="mb-1 block text-xs font-medium text-[var(--color-muted)]">{p.label}</span>
      <div class="relative">
        <select
          class="w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-2 pr-7 text-sm outline-none focus:border-primary-500"
          value={(sp[p.name] as string) ?? ""}
          onChange={(e) => setParam(p.name, e.currentTarget.value)}
        >
          <For each={FEE_STOPS}>{(o) => <option value={o.value}>{o.label}</option>}</For>
        </select>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  );

  return (
    <aside aria-label="Filters" class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-base font-bold text-[var(--color-ink)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-primary-600" aria-hidden="true">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
          </svg>
          All filters
        </h2>
        <button
          type="button"
          onClick={clearAll}
          class="rounded-[var(--radius-md)] px-2 py-1 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          Clear all
        </button>
      </div>

      {/* Applied filters */}
      <Show when={props.cityName || chips().length}>
        <div class="flex flex-wrap gap-2 pb-1">
          <Show when={props.cityName}>
            <span class="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              {props.cityName}
            </span>
          </Show>
          <For each={chips()}>
            {(ch) => (
              <button
                type="button"
                onClick={() => setParam(ch.name, "")}
                class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-primary-300 hover:text-primary-700"
              >
                {ch.label}
                <span aria-hidden="true">×</span>
              </button>
            )}
          </For>
        </div>
      </Show>

      <Show when={props.specializations.length}>
        <Group title={props.specializationLabel ?? "Course"} name="course" options={props.specializations} />
      </Show>
      <Group title="College type" name="type" options={props.filters.types} />
      <Group title="Exam accepted" name="exam" options={props.filters.exams} />
      <Group title="Approval" name="approval" options={props.filters.approvals} />

      <details open class="border-t border-[var(--color-line)] pt-3">
        <summary class="cursor-pointer list-none text-sm font-bold text-[var(--color-ink)]">
          Fees range
        </summary>
        <div class="mt-2 grid grid-cols-2 gap-3">
          <FeeSelect label="Min" name="fees_min" />
          <FeeSelect label="Max" name="fees_max" />
        </div>
      </details>

      <noscript>
        <p class="text-xs text-[var(--color-muted)]">
          Filters use the page address. Each option is also available as a direct link.
        </p>
      </noscript>
    </aside>
  );
}
