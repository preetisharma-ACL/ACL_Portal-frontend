import { A, createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import { Section } from "~/components/ui";
import { EmptyState } from "~/components/states";
import { searchQuery } from "~/lib/queries";

/** Unified search results. Type-ahead and richer grouping arrive in Phase 5. */
export default function SearchPage(props: { query: string }) {
  const results = createAsync(() => searchQuery(props.query));
  const total = () => {
    const r = results();
    return r ? r.colleges.length + r.courses.length + r.exams.length : 0;
  };

  return (
    <Section>
      <h1 class="text-2xl font-bold mb-6">
        <Show when={props.query} fallback="Search">
          Results for "{props.query}"
        </Show>
      </h1>
      <Show
        when={total() > 0}
        fallback={
          <EmptyState title="Nothing found yet">
            Try a different course, college or exam name.
          </EmptyState>
        }
      >
        {(_) => {
          const r = results()!;
          return (
            <div class="space-y-8">
              <Show when={r.colleges.length}>
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
              <Show when={r.courses.length}>
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
              <Show when={r.exams.length}>
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
