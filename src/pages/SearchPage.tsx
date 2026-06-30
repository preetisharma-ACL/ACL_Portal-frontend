import { A, createAsync, useSearchParams } from "@solidjs/router";
import { For, Show, type JSX } from "solid-js";
import SearchAutocomplete from "~/components/SearchAutocomplete";
import CollegeLogo from "~/components/CollegeLogo";
import SlotImage from "~/components/SlotImage";
import { allCollegesQuery, searchQuery } from "~/lib/queries";
import type { CollegeCard } from "~/lib/types";

type Scope = "all" | "colleges" | "courses" | "exams";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "colleges", label: "Colleges" },
  { value: "courses", label: "Courses" },
  { value: "exams", label: "Exams" },
];

/** A few popular searches shown on the empty state to get users started. */
const POPULAR = ["MBA", "Engineering", "Law", "CAT", "Bengaluru", "BBA"];

/**
 * Editorially picked top-rated colleges, surfaced above search results: one
 * government and one private pick, shown side by side.
 */
const RECOMMENDED: {
  id: number;
  slug: string;
  name: string;
  tag: string;
  tone: "primary" | "accent";
  fallbackCity: string;
  desc: string;
}[] = [
  {
    id: 144,
    slug: "banaras-hindu-university-varanasi",
    name: "Banaras Hindu University",
    tag: "Government College",
    tone: "primary",
    fallbackCity: "Varanasi",
    desc: "One of India's largest central universities, renowned for academics and research.",
  },
  {
    id: 168,
    slug: "school-of-management-sciences-varanasi-varanasi",
    name: "School of Management Sciences, Varanasi",
    tag: "Private College",
    tone: "accent",
    fallbackCity: "Varanasi",
    desc: "A leading private institute for management, computer applications and commerce.",
  },
];

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
  // The /search API returns sparse colleges (id/name/slug) and misses many
  // matches, so we also search the rich all-colleges list (from /university):
  // name, city, type and courses. Keywords like "mba", "varanasi" or
  // "mba colleges in varanasi" all match here.
  const allColleges = createAsync(() => allCollegesQuery());
  const cardById = () => {
    const m = new Map<number, CollegeCard>();
    for (const cc of allColleges() ?? []) m.set(cc.id, cc);
    return m;
  };

  const STOP = new Set([
    "in", "the", "of", "for", "and", "a", "to", "with", "near", "at", "best",
    "top", "list", "colleges", "college",
  ]);
  const queryTokens = () =>
    props.query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));

  /** Colleges whose name/city/type/courses contain every query token. */
  const localColleges = (): CollegeCard[] => {
    const ts = queryTokens();
    if (!ts.length) return [];
    return (allColleges() ?? []).filter((c) => {
      const hay = `${c.name} ${c.city} ${c.type} ${c.key_courses.join(" ")}`.toLowerCase();
      return ts.every((t) => hay.includes(t));
    });
  };

  type CollegeResult = {
    id: number; slug: string; name: string; city: string; type: string;
    logo: string; key_courses: string[];
  };
  /** Keyword matches merged with backend search colleges (dedup by id). */
  const collegeResults = (): CollegeResult[] => {
    const local = localColleges();
    const seen = new Set(local.map((c) => c.id));
    const extra: CollegeResult[] = (results()?.colleges ?? [])
      .filter((c) => !seen.has(c.id))
      .map((c) => {
        const ec = cardById().get(c.id);
        return {
          id: c.id, slug: c.slug, name: c.name,
          city: ec?.city ?? "", type: ec?.type ?? "",
          logo: ec?.logo ?? "", key_courses: ec?.key_courses ?? [],
        };
      });
    return [...local, ...extra];
  };

  const show = (s: Scope) => scope() === "all" || scope() === s;
  const counts = () => {
    const r = results();
    return {
      colleges: collegeResults().length,
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
      <section class="relative z-30 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
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

      {/* Top-rated picks, shown above the results on the search results page. */}
      <Show when={props.query}>
        <section class="container-x pt-8 md:pt-10">
          <div class="mb-1 flex items-center gap-3">
            <span class="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-warning)]/15 text-[var(--color-warning)]">
              <svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true">
                <path d="M12 2 9.2 8.6 2 9.2l5.5 4.7L5.8 21 12 17l6.2 4-1.7-7.1L22 9.2l-7.2-.6Z" />
              </svg>
            </span>
            <div>
              <h2 class="text-xl font-extrabold leading-tight">Top rated colleges</h2>
              <p class="text-sm text-[var(--color-muted)]">Our hand-picked government and private recommendations.</p>
            </div>
          </div>
          <div class="mt-4 grid gap-5 sm:grid-cols-2">
            <For each={RECOMMENDED}>
              {(rc) => {
                const card = () => cardById().get(rc.id);
                const meta = () =>
                  [card()?.city || rc.fallbackCity, card()?.type].filter(Boolean).join(" · ");
                const courses = () => (card()?.key_courses ?? []).slice(0, 4).join(", ");
                return (
                  <A
                    href={`/college/${rc.slug}-${rc.id}`}
                    class="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-canvas)] shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Ribbon header */}
                    <div
                      class="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white"
                      classList={{
                        "bg-gradient-to-r from-primary-600 to-primary-700": rc.tone === "primary",
                        "bg-gradient-to-r from-accent-500 to-accent-600": rc.tone === "accent",
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                        <path d="M5 3h14v2a5 5 0 0 1-3.5 4.78A4 4 0 0 1 13 12.9V15h2a3 3 0 0 1 3 3v1H6v-1a3 3 0 0 1 3-3h2v-2.1a4 4 0 0 1-2.5-3.12A5 5 0 0 1 5 5V3Z" />
                      </svg>
                      Recommended · {rc.tag}
                    </div>

                    {/* Body */}
                    <div class="flex flex-1 flex-col p-4">
                      <div class="flex items-center gap-3">
                        <span class="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-1">
                          <CollegeLogo
                            name={rc.name}
                            logo={card()?.logo ?? ""}
                            id={rc.id}
                            class="max-h-full max-w-full text-base"
                          />
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary-700">
                            {rc.name}
                          </span>
                          <span class="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--color-muted)]">
                            {meta()}
                            <Show when={(card()?.rating ?? 0) > 0}>
                              <span class="inline-flex items-center gap-0.5 font-bold text-[var(--color-ink)]">
                                <span aria-hidden="true" class="text-[var(--color-warning)]">★</span>
                                {card()!.rating.toFixed(1)}
                              </span>
                            </Show>
                          </span>
                        </span>
                      </div>

                      {/* One-line description */}
                      <p class="mt-2.5 text-xs leading-relaxed text-[var(--color-muted)] line-clamp-1">
                        {rc.desc}
                      </p>

                      {/* Courses offered */}
                      <Show when={courses()}>
                        <p class="mt-2 text-xs leading-relaxed text-[var(--color-ink)]/80 line-clamp-1">
                          <span class="font-semibold text-[var(--color-ink)]">Courses offered: </span>
                          {courses()}
                        </p>
                      </Show>
                    </div>

                    {/* Footer CTA */}
                    <div class="mt-auto flex items-center justify-between border-t border-[var(--color-line)] px-4 py-2.5">
                      <span class="text-[11px] font-medium text-[var(--color-muted)]">
                        Free guidance
                      </span>
                      <span
                        class="inline-flex items-center gap-1 text-xs font-bold transition-colors"
                        classList={{
                          "text-primary-700 group-hover:text-primary-900": rc.tone === "primary",
                          "text-accent-600 group-hover:text-accent-700": rc.tone === "accent",
                        }}
                      >
                        View details
                        <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
                      </span>
                    </div>
                  </A>
                );
              }}
            </For>
          </div>
        </section>
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
                <Show when={show("colleges") && collegeResults().length}>
                  <ResultGroup
                    label="Colleges"
                    count={collegeResults().length}
                    accent="primary"
                    icon='<path d="m3 21 18 0"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9 21v-6h6v6"/>'
                  >
                    <For each={collegeResults()}>
                      {(c) => {
                        const meta = [c.city, c.type].filter(Boolean).join(" · ");
                        return (
                          <A
                            href={`/college/${c.slug}-${c.id}`}
                            class="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-all hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <CollegeLogo
                              name={c.name}
                              logo={c.logo}
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
                              <Show when={c.key_courses.length}>
                                <span class="mt-1.5 flex flex-wrap gap-1">
                                  <For each={c.key_courses.slice(0, 4)}>
                                    {(k) => (
                                      <span class="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                                        {k}
                                      </span>
                                    )}
                                  </For>
                                </span>
                              </Show>
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
