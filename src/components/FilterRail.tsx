import { useSearchParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import type { ListingFilters, FilterOption } from "~/lib/types";
import { track } from "~/lib/analytics";

const SORTS: FilterOption[] = [
  { value: "relevance", label: "Relevance" },
  { value: "fees", label: "Fees: low to high" },
  { value: "rating", label: "Rating" },
];

const FEE_STOPS: FilterOption[] = [
  { value: "", label: "Any" },
  { value: "200000", label: "INR 2L" },
  { value: "500000", label: "INR 5L" },
  { value: "1000000", label: "INR 10L" },
  { value: "2000000", label: "INR 20L" },
];

/**
 * Filter rail. Every change writes to the URL query string via setSearchParams,
 * so filtered states are shareable and re-render from the server loader. The
 * "page" param is reset on any filter change.
 */
export default function FilterRail(props: {
  filters: ListingFilters;
  specializations: FilterOption[];
  /** Label for the course/specialisation filter (city mode uses "Course"). */
  specializationLabel?: string;
}) {
  const [sp, setSp] = useSearchParams();

  function update(key: string, value: string) {
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

  const Select = (p: {
    label: string;
    name: string;
    options: FilterOption[];
    includeAll?: boolean;
    defaultValue?: string;
  }) => (
    <label class="block">
      <span class="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">{p.label}</span>
      <div class="relative">
        <select
          class="w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 pr-9 text-sm text-[var(--color-ink)] outline-none transition-colors hover:border-[var(--color-muted)]/50 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          value={(sp[p.name] as string) ?? p.defaultValue ?? ""}
          onChange={(e) => update(p.name, e.currentTarget.value)}
        >
          <Show when={p.includeAll !== false}>
            <option value="">All</option>
          </Show>
          <For each={p.options}>
            {(o) => (
              <option value={o.value}>
                {o.label}
                {o.count != null ? ` (${o.count})` : ""}
              </option>
            )}
          </For>
        </select>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  );

  return (
    <aside aria-label="Filters" class="space-y-4">
      <div class="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
        <h2 class="flex items-center gap-2 text-lg font-bold text-[var(--color-ink)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-primary-600" aria-hidden="true">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
          </svg>
          Filters
        </h2>
        <button
          type="button"
          onClick={clearAll}
          class="rounded-[var(--radius-md)] px-2 py-1 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          Clear all
        </button>
      </div>

      <Select
        label="Sort by"
        name="sort"
        options={SORTS}
        includeAll={false}
        defaultValue="relevance"
      />

      <Show when={props.specializations.length}>
        <Select
          label={props.specializationLabel ?? "Specialisation"}
          name="course"
          options={props.specializations}
        />
      </Show>

      <Select label="College type" name="type" options={props.filters.types} />
      <Select label="Exam accepted" name="exam" options={props.filters.exams} />
      <Select label="Approval" name="approval" options={props.filters.approvals} />

      <div>
        <span class="mb-1.5 block text-[13px] font-semibold text-[var(--color-ink)]">Fees range</span>
        <div class="grid grid-cols-2 gap-3">
          <Select label="Min" name="fees_min" options={FEE_STOPS} includeAll={false} />
          <Select label="Max" name="fees_max" options={FEE_STOPS} includeAll={false} />
        </div>
      </div>

      <noscript>
        <p class="text-xs text-[var(--color-muted)]">
          Filters use the page address. Each option is also available as a direct link.
        </p>
      </noscript>
    </aside>
  );
}
