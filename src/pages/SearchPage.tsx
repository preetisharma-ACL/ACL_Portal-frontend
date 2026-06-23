import { A, createAsync, useSearchParams } from "@solidjs/router";
import { For, Show, type JSX } from "solid-js";
import SearchAutocomplete from "~/components/SearchAutocomplete";
import CollegeLogo from "~/components/CollegeLogo";
import SlotImage from "~/components/SlotImage";
import { searchQuery } from "~/lib/queries";

type Scope = "all" | "colleges" | "courses" | "exams";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "colleges", label: "Colleges" },
  { value: "courses", label: "Courses" },
  { value: "exams", label: "Exams" },
];

/** A few popular searches shown on the empty state to get users started. */
const POPULAR = ["MBA", "Engineering", "Law", "CAT", "Bengaluru", "BBA"];

function Icon(props: { d: string; class?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class ?? "w-5 h-5"}
      aria-hidden="true"
      innerHTML={props.d}
    />
  );
}

const COURSE_ICON = '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5"/>';
const EXAM_ICON =
  '<path d="M9 4h6a2 2 0 0 1 2 2v0H7v0a2 2 0 0 1 2-2Z"/><rect x="5" y="4" width="14" height="17" rx="2"/><path d="m9 13 2 2 4-4"/>';

/** Unified search results across colleges, courses and exams, with type-ahead. */
export default function SearchPage(props: { query: string }) {
  const [sp, setSp] = useSearchParams();
  const scope = (): Scope => (sp.type as Scope) || "all";
  const results = createAsync(() => searchQuery(props.query));

  const show = (s: Scope) => scope() === "all" || scope() === s;
  const counts = () => {
    const r = results();
    return {
      colleges: r?.colleges.length ?? 0,
      courses: r?.courses.length ?? 0,
      exams: r?.exams.length ?? 0,
    };
  };
  const scopeCount = (s: Scope) => {
    const c = counts();
    return s === "all" ? c.colleges + c.courses + c.exams : c[s];
  };
  const visibleCount = () => {
    let n = 0;
    if (show("colleges")) n += counts().colleges;
    if (show("courses")) n += counts().courses;
    if (show("exams")) n += counts().exams;
    return n;
  };

  return (
    <>
      {/* Premium search header. No overflow-hidden on the section itself, or it
          would clip the suggestions dropdown; the blur glows are clipped by their
          own inset wrapper instead. */}
      <section class="relative z-30 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <SlotImage slot="search_header" overlay />
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
          <div class="absolute -top-24 -right-10 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
          <div class="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-primary-400/20 blur-3xl" />
        </div>
        <div class="container-x relative z-10 py-12 md:py-16">
          <span class="text-xs font-semibold uppercase tracking-wider text-accent-300">
            Explore
          </span>
          <h1 class="mt-2 text-3xl md:text-4xl font-extrabold leading-tight text-white">
            <Show when={props.query} fallback="Search colleges, courses and exams">
              Results for "{props.query}"
            </Show>
          </h1>
          <p class="mt-2 max-w-2xl text-white/80">
            Find and compare colleges, courses and entrance exams across India, all in one place.
          </p>

          <div class="mt-6 max-w-2xl">
            <SearchAutocomplete initial={props.query} />
          </div>

          <Show when={props.query}>
            <p class="mt-4 text-sm text-white/75">
              <span class="font-semibold text-white">{visibleCount()}</span> result
              {visibleCount() === 1 ? "" : "s"} for "{props.query}"
            </p>
          </Show>
        </div>
      </section>

      {/* Scope tabs */}
      <Show when={props.query}>
        <div class="sticky top-16 z-20 border-b border-[var(--color-line)] bg-[var(--color-surface)]/90 backdrop-blur">
          <div class="container-x flex flex-wrap gap-2 py-3" role="tablist" aria-label="Filter results">
            <For each={SCOPES}>
              {(s) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={scope() === s.value}
                  onClick={() => setSp({ type: s.value === "all" ? undefined : s.value })}
                  class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
                  classList={{
                    "bg-primary-600 text-white border-primary-600 shadow-sm": scope() === s.value,
                    "border-[var(--color-line)] text-[var(--color-ink)] hover:border-primary-300 hover:text-primary-700":
                      scope() !== s.value,
                  }}
                >
                  {s.label}
                  <span
                    class="rounded-full px-1.5 text-xs font-semibold"
                    classList={{
                      "bg-white/20 text-white": scope() === s.value,
                      "bg-[var(--color-canvas)] text-[var(--color-muted)]": scope() !== s.value,
                    }}
                  >
                    {scopeCount(s.value)}
                  </span>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      <div class="container-x py-10 md:py-12">
        <Show
          when={props.query && visibleCount() > 0}
          fallback={
            <div class="mx-auto max-w-xl rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-12 text-center">
              <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-50 text-primary-600">
                <Icon
                  d='<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'
                  class="h-7 w-7"
                />
              </span>
              <h2 class="mt-4 text-lg font-bold">
                <Show when={props.query} fallback="Start your search">
                  No matches for "{props.query}"
                </Show>
              </h2>
              <p class="mt-2 text-sm text-[var(--color-muted)]">
                <Show
                  when={props.query}
                  fallback="Search across colleges, courses and entrance exams to compare options that fit your goals."
                >
                  Try a different course, college or exam name, or pick a popular search below.
                </Show>
              </p>
              <div class="mt-5 flex flex-wrap justify-center gap-2">
                <For each={POPULAR}>
                  {(term) => (
                    <A
                      href={`/search?q=${encodeURIComponent(term)}`}
                      class="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      {term}
                    </A>
                  )}
                </For>
              </div>
            </div>
          }
        >
          {(_) => {
            const r = results()!;
            return (
              <div class="space-y-10">
                {/* Colleges */}
                <Show when={show("colleges") && r.colleges.length}>
                  <ResultGroup
                    label="Colleges"
                    count={r.colleges.length}
                    accent="primary"
                    icon='<path d="m3 21 18 0"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9 21v-6h6v6"/>'
                  >
                    <For each={r.colleges}>
                      {(c) => {
                        const meta = [c.city, c.type].filter(Boolean).join(" · ");
                        return (
                          <A
                            href={`/college/${c.slug}-${c.id}`}
                            class="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-all hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <CollegeLogo
                              name={c.name}
                              id={c.id}
                              class="h-12 w-12 shrink-0 rounded-[var(--radius-md)] text-base"
                            />
                            <span class="min-w-0 flex-1">
                              <span class="block font-semibold leading-snug line-clamp-2 group-hover:text-primary-700">
                                {c.name}
                              </span>
                              <span class="mt-0.5 block text-xs text-[var(--color-muted)]">
                                {meta || "View college details"}
                              </span>
                            </span>
                            <span
                              aria-hidden="true"
                              class="text-primary-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
                            >
                              →
                            </span>
                          </A>
                        );
                      }}
                    </For>
                  </ResultGroup>
                </Show>

                {/* Courses */}
                <Show when={show("courses") && r.courses.length}>
                  <ResultGroup
                    label="Courses"
                    count={r.courses.length}
                    accent="accent"
                    icon={COURSE_ICON}
                  >
                    <For each={r.courses}>
                      {(c) => (
                        <ItemTile
                          href={`/${c.slug}-course`}
                          name={c.name}
                          sub="Course overview, fees and colleges"
                          icon={COURSE_ICON}
                          tone="accent"
                        />
                      )}
                    </For>
                  </ResultGroup>
                </Show>

                {/* Exams */}
                <Show when={show("exams") && r.exams.length}>
                  <ResultGroup
                    label="Exams"
                    count={r.exams.length}
                    accent="primary"
                    icon={EXAM_ICON}
                  >
                    <For each={r.exams}>
                      {(e) => (
                        <ItemTile
                          href={`/mba/${e.slug}-exam`}
                          name={e.name}
                          sub="Pattern, dates and accepting colleges"
                          icon={EXAM_ICON}
                          tone="primary"
                        />
                      )}
                    </For>
                  </ResultGroup>
                </Show>
              </div>
            );
          }}
        </Show>
      </div>
    </>
  );
}

/** Section wrapper: heading with icon + count chip, then a responsive card grid. */
function ResultGroup(props: {
  label: string;
  count: number;
  accent: "primary" | "accent";
  icon: string;
  children: JSX.Element;
}) {
  return (
    <section>
      <div class="mb-4 flex items-center gap-3">
        <span
          class="grid h-9 w-9 place-items-center rounded-[var(--radius-md)]"
          classList={{
            "bg-primary-50 text-primary-700": props.accent === "primary",
            "bg-accent-400/15 text-accent-600": props.accent === "accent",
          }}
        >
          <Icon d={props.icon} />
        </span>
        <h2 class="text-xl font-extrabold">{props.label}</h2>
        <span class="rounded-full bg-[var(--color-canvas)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-muted)]">
          {props.count}
        </span>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{props.children}</div>
    </section>
  );
}

/** Compact iconed result tile used for courses and exams. */
function ItemTile(props: {
  href: string;
  name: string;
  sub: string;
  icon: string;
  tone: "primary" | "accent";
}) {
  return (
    <A
      href={props.href}
      class="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-all hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <span
        class="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)]"
        classList={{
          "bg-primary-50 text-primary-700": props.tone === "primary",
          "bg-accent-400/15 text-accent-600": props.tone === "accent",
        }}
      >
        <Icon d={props.icon} />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold leading-snug line-clamp-1 group-hover:text-primary-700">
          {props.name}
        </span>
        <span class="mt-0.5 block text-xs text-[var(--color-muted)] line-clamp-1">{props.sub}</span>
      </span>
      <span
        aria-hidden="true"
        class="text-primary-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
      >
        →
      </span>
    </A>
  );
}
