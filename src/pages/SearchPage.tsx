import { A, createAsync, useSearchParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import { Section } from "~/components/ui";
import { EmptyState } from "~/components/states";
import SearchAutocomplete from "~/components/SearchAutocomplete";
import { searchQuery } from "~/lib/queries";

type Scope = "all" | "colleges" | "courses" | "exams";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "colleges", label: "Colleges" },
  { value: "courses", label: "Courses" },
  { value: "exams", label: "Exams" },
];

/** Unified search results across colleges, courses and exams, with type-ahead. */
export default function SearchPage(props: { query: string }) {
  const [sp, setSp] = useSearchParams();
  const scope = (): Scope => ((sp.type as Scope) || "all");
  const results = createAsync(() => searchQuery(props.query));

  const show = (s: Scope) => scope() === "all" || scope() === s;
  const visibleCount = () => {
    const r = results();
    if (!r) return 0;
    let n = 0;
    if (show("colleges")) n += r.colleges.length;
    if (show("courses")) n += r.courses.length;
    if (show("exams")) n += r.exams.length;
    return n;
  };

  return (
    <Section>
      <h1 class="text-2xl font-bold mb-4">
        <Show when={props.query} fallback="Search colleges, courses and exams">
          Results for "{props.query}"
        </Show>
      </h1>

      <div class="max-w-2xl mb-6">
        <SearchAutocomplete initial={props.query} />
      </div>

      <Show when={props.query}>
        <div class="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Filter results">
          <For each={SCOPES}>
            {(s) => (
              <button
                type="button"
                role="tab"
                aria-selected={scope() === s.value}
                onClick={() => setSp({ type: s.value === "all" ? undefined : s.value })}
                class="text-sm px-3 py-1.5 rounded-full border transition-colors"
                classList={{
                  "bg-primary-600 text-white border-primary-600": scope() === s.value,
                  "border-[var(--color-line)] hover:border-primary-300": scope() !== s.value,
                }}
              >
                {s.label}
              </button>
            )}
          </For>
        </div>
      </Show>

      <Show
        when={props.query && visibleCount() > 0}
        fallback={
          <EmptyState title={props.query ? "Nothing found" : "Start typing to search"}>
            <Show
              when={props.query}
              fallback="Search across colleges, courses and entrance exams to compare options that fit your goals."
            >
              No matches for "{props.query}". Try a different course, college or exam name.
            </Show>
          </EmptyState>
        }
      >
        {(_) => {
          const r = results()!;
          return (
            <div class="space-y-8">
              <Show when={show("colleges") && r.colleges.length}>
                <div>
                  <h2 class="font-semibold mb-3">Colleges</h2>
                  <ul class="space-y-2">
                    <For each={r.colleges}>
                      {(c) => (
                        <li>
                          <A
                            href={`/college/${c.slug}-${c.id}`}
                            class="text-primary-700 hover:underline"
                          >
                            {c.name}
                          </A>{" "}
                          <span class="text-sm text-[var(--color-muted)]">
                            {c.city} · {c.type}
                          </span>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
              <Show when={show("courses") && r.courses.length}>
                <div>
                  <h2 class="font-semibold mb-3">Courses</h2>
                  <ul class="space-y-2">
                    <For each={r.courses}>
                      {(c) => (
                        <li>
                          <A href={`/${c.slug}-course`} class="text-primary-700 hover:underline">
                            {c.name}
                          </A>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
              <Show when={show("exams") && r.exams.length}>
                <div>
                  <h2 class="font-semibold mb-3">Exams</h2>
                  <ul class="space-y-2">
                    <For each={r.exams}>
                      {(e) => (
                        <li>
                          <A href={`/mba/${e.slug}-exam`} class="text-primary-700 hover:underline">
                            {e.name}
                          </A>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
            </div>
          );
        }}
      </Show>
    </Section>
  );
}
