import { createAsync } from "@solidjs/router";
import { A } from "@solidjs/router";
import { For, Show, createMemo, createSignal } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeLogo from "~/components/CollegeLogo";
import LeadTrigger from "~/components/LeadTrigger";
import { LoadingBlock } from "~/components/states";
import { allCollegesQuery } from "~/lib/queries";
import { breadcrumbLd } from "~/lib/jsonld";
import type { CollegeCard } from "~/lib/types";

/** No backend "university vs college" field exists, so classify by name. */
const isUniversity = (c: CollegeCard) =>
  /\buniversity\b|vishwavidyalaya|vidyapeeth|vidyapith|vishwa vidyalaya/i.test(c.name);

const uniqueSorted = (xs: string[]) =>
  Array.from(new Set(xs.map((x) => x?.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );

function sortList(list: CollegeCard[], mode: string): CollegeCard[] {
  const arr = [...list];
  if (mode === "rating") arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (mode === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
  else
    arr.sort((a, b) => {
      const ra = a.nirf_rank?.rank ?? Infinity;
      const rb = b.nirf_rank?.rank ?? Infinity;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  return arr;
}

const selectClass =
  "h-10 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none transition-colors hover:border-[var(--color-muted)]/50 focus:border-primary-500 cursor-pointer";

/** One institution row, as a standalone card that flows on the page. */
function Row(props: { c: CollegeCard }) {
  const c = props.c;
  return (
    <A
      href={`/college/${c.slug}-${c.id}`}
      class="group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm"
    >
      <CollegeLogo
        name={c.name}
        logo={c.logo}
        id={c.id}
        class="h-12 w-12 shrink-0 rounded-[var(--radius-md)] text-sm"
      />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h3 class="truncate text-[15px] font-semibold text-[var(--color-ink)] group-hover:text-primary-700">
            {c.name}
          </h3>
          <Show when={c.nirf_rank}>
            {(r) => (
              <span class="shrink-0 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-600">
                {r().agency} #{r().rank}
              </span>
            )}
          </Show>
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-muted)]">
          <span class="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3.5 w-3.5" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {c.city || "India"}
          </span>
          <Show when={c.type}>
            <span class="text-[var(--color-line)]">|</span>
            <span>{c.type}</span>
          </Show>
          <For each={c.key_courses.slice(0, 3)}>
            {(k) => (
              <span class="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                {k}
              </span>
            )}
          </For>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <Show when={c.rating > 0}>
          <span class="inline-flex items-center gap-1 rounded-md bg-[var(--color-canvas)] px-2 py-1 text-xs font-semibold text-[var(--color-ink)]">
            <svg viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 text-[var(--color-warning)]" aria-hidden="true">
              <path d="m12 17.3 6.18 3.7-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            {c.rating.toFixed(1)}
          </span>
        </Show>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </A>
  );
}

/** A column (universities or colleges): a clean header bar + a list of cards
 *  that flow with the page (no inner scroll box). */
function Panel(props: {
  title: string;
  count: number;
  icon: "uni" | "college";
  items: CollegeCard[];
}) {
  return (
    <section>
      <header class="sticky top-32 z-20 -mx-1 mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-md)] border-b-2 border-primary-600 bg-[var(--color-canvas)]/95 px-1 pb-3 pt-1 backdrop-blur">
        <div class="flex items-center gap-2.5">
          <span class="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-primary-600 text-white">
            <Show
              when={props.icon === "uni"}
              fallback={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
                  <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                  <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
                </svg>
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 11h.01M15 11h.01M9 14h.01M15 14h.01" />
              </svg>
            </Show>
          </span>
          <h2 class="text-lg font-extrabold tracking-tight text-[var(--color-ink)]">{props.title}</h2>
        </div>
        <span class="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-700">
          {props.count}
        </span>
      </header>
      <Show
        when={props.items.length}
        fallback={
          <p class="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
            No matches. Try clearing a filter.
          </p>
        }
      >
        <div class="space-y-2.5">
          <For each={props.items}>{(c) => <Row c={c} />}</For>
        </div>
      </Show>
    </section>
  );
}

export default function Directory() {
  const data = createAsync(() => allCollegesQuery(), { deferStream: true });

  const [q, setQ] = createSignal("");
  const [city, setCity] = createSignal("");
  const [course, setCourse] = createSignal("");
  const [type, setType] = createSignal("");
  const [sort, setSort] = createSignal("rank");

  const all = () => data() ?? [];
  const cityOptions = createMemo(() => uniqueSorted(all().map((c) => c.city)));
  const courseOptions = createMemo(() => uniqueSorted(all().flatMap((c) => c.key_courses)));
  const typeOptions = createMemo(() => uniqueSorted(all().map((c) => c.type)));

  const hasFilters = () => !!(q().trim() || city() || course() || type());
  function clearFilters() {
    setQ("");
    setCity("");
    setCourse("");
    setType("");
  }

  const filtered = createMemo(() => {
    const term = q().trim().toLowerCase();
    const list = all().filter((c) => {
      if (city() && c.city !== city()) return false;
      if (type() && c.type !== type()) return false;
      if (course() && !c.key_courses.some((k) => k.toLowerCase() === course().toLowerCase()))
        return false;
      if (term) {
        const hit =
          c.name.toLowerCase().includes(term) ||
          c.city.toLowerCase().includes(term) ||
          c.key_courses.some((k) => k.toLowerCase().includes(term));
        if (!hit) return false;
      }
      return true;
    });
    return sortList(list, sort());
  });

  const universities = createMemo(() => filtered().filter(isUniversity));
  const colleges = createMemo(() => filtered().filter((c) => !isUniversity(c)));

  const crumbs = () => [
    { name: "Home", path: "/" },
    { name: "Universities and colleges", path: "/university" },
  ];

  return (
    <>
      <Seo
        title="Universities and Colleges in India: Directory, Courses and Fees"
        description="Browse every university and college in one place. Filter by city, course and type, and search by name or course to find institutes that offer MBA, BTech, MBBS and more."
        canonical="/university"
        jsonLd={breadcrumbLd(crumbs())}
      />

      <Show when={data()} fallback={<LoadingBlock label="Loading institutions" />}>
        {/* Hero with banner image */}
        <section class="relative overflow-hidden bg-primary-900 text-white">
          <img
            src="/bg-image.jpg"
            alt=""
            aria-hidden="true"
            class="absolute inset-0 h-full w-full object-cover object-center opacity-40"
          />
          {/* Readability overlay over the banner */}
          <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-900/90 to-primary-900/55" />
          <div aria-hidden="true" class="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
          <div class="container-x relative z-10 py-10 md:py-14">
            <Breadcrumbs crumbs={crumbs()} light />
            <h1 class="mt-4 max-w-3xl text-3xl font-extrabold leading-tight md:text-4xl">
              Explore universities and colleges
            </h1>
            <p class="mt-3 max-w-2xl text-white/80">
              Every institution in one place. Search by name or course, and filter by city, course
              and type. Guidance is free for students.
            </p>
            <div class="mt-6 flex flex-wrap gap-2.5">
              <For
                each={[
                  { k: "Institutions", v: String(all().length) },
                  { k: "Universities", v: String(all().filter(isUniversity).length) },
                  { k: "Cities", v: String(cityOptions().length) },
                ]}
              >
                {(s) => (
                  <span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm">
                    <span class="font-bold">{s.v}</span>
                    <span class="text-white/70">{s.k}</span>
                  </span>
                )}
              </For>
            </div>
          </div>
        </section>

        {/* Sticky filter toolbar */}
        <div class="sticky top-16 z-30 border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur">
          <div class="container-x py-3">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Search */}
              <div class="relative flex-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  value={q()}
                  onInput={(e) => setQ(e.currentTarget.value)}
                  placeholder="Search institutes or courses, e.g. MBA, IIT, Delhi"
                  class="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] pl-10 pr-3 text-sm text-[var(--color-ink)] outline-none transition-colors hover:border-[var(--color-muted)]/50 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                />
              </div>
              {/* Selects */}
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
                <select class={selectClass} value={city()} onChange={(e) => setCity(e.currentTarget.value)}>
                  <option value="">All cities</option>
                  <For each={cityOptions()}>{(o) => <option value={o}>{o}</option>}</For>
                </select>
                <select class={selectClass} value={course()} onChange={(e) => setCourse(e.currentTarget.value)}>
                  <option value="">All courses</option>
                  <For each={courseOptions()}>{(o) => <option value={o}>{o}</option>}</For>
                </select>
                <select class={selectClass} value={type()} onChange={(e) => setType(e.currentTarget.value)}>
                  <option value="">All types</option>
                  <For each={typeOptions()}>{(o) => <option value={o}>{o}</option>}</For>
                </select>
                <select class={selectClass} value={sort()} onChange={(e) => setSort(e.currentTarget.value)}>
                  <option value="rank">Sort: NIRF rank</option>
                  <option value="rating">Sort: Rating</option>
                  <option value="name">Sort: Name (A-Z)</option>
                </select>
              </div>
              <Show when={hasFilters()}>
                <button
                  type="button"
                  onClick={clearFilters}
                  class="h-10 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-line)] px-3 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-primary-300 hover:text-primary-700"
                >
                  Clear filters
                </button>
              </Show>
            </div>
            <p class="mt-2 text-xs text-[var(--color-muted)]">
              Showing <span class="font-semibold text-[var(--color-ink)]">{filtered().length}</span>{" "}
              of {all().length} institutions
            </p>
          </div>
        </div>

        {/* Two panels */}
        <div class="container-x py-8">
          <div class="grid items-start gap-6 lg:grid-cols-2">
            <Panel title="Universities" icon="uni" count={universities().length} items={universities()} />
            <Panel title="Colleges and institutes" icon="college" count={colleges().length} items={colleges()} />
          </div>

          {/* CTA */}
          <div class="mt-10 overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-primary-900 to-primary-700 p-6 text-white sm:p-8">
            <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-xl font-extrabold">Not sure which institute fits you?</h2>
                <p class="mt-1 max-w-xl text-white/80">
                  Get free, independent guidance on courses, fees and admissions. We do not charge
                  students.
                </p>
              </div>
              <LeadTrigger sourcePage="/university" label="Get free guidance" size="lg" />
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
