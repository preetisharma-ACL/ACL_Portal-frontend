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
      <span class="block text-sm font-medium mb-1">{p.label}</span>
      <select
        class="w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
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
    </label>
  );

  return (
    <aside aria-label="Filters" class="space-y-5">
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-lg">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          class="text-sm text-primary-700 hover:underline"
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

      <div class="grid grid-cols-2 gap-3">
        <Select label="Min fees" name="fees_min" options={FEE_STOPS} includeAll={false} />
        <Select label="Max fees" name="fees_max" options={FEE_STOPS} includeAll={false} />
      </div>

      <noscript>
        <p class="text-xs text-[var(--color-muted)]">
          Filters use the page address. Each option is also available as a direct link.
        </p>
      </noscript>
    </aside>
  );
}
