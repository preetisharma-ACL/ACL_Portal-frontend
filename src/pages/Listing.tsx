import { A, createAsync, useParams, useSearchParams } from "@solidjs/router";
import { For, Show, createSignal, onMount } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeListRow from "~/components/CollegeListRow";
import FilterRail from "~/components/FilterRail";
import Faq from "~/components/Faq";
import LeadForm from "~/components/LeadForm";
import LeadTrigger from "~/components/LeadTrigger";
import StreamIcon from "~/components/StreamIcon";
import { Card, Section } from "~/components/ui";
import { EmptyState, LoadingBlock } from "~/components/states";
import { citiesQuery, listingQuery, streamsQuery } from "~/lib/queries";
import { cityCollegesAction } from "~/lib/actions";
import { cityCollegesPath, humanize, listingPath, parseListingSlug } from "~/lib/slug";
import { breadcrumbLd, faqLd } from "~/lib/jsonld";
import type { CollegeCard, FilterOption, ListingQuery } from "~/lib/types";

/**
 * College listing. Two modes share this page:
 *  - stream mode: /[stream]/colleges/[listing] — colleges for a course in a city.
 *  - city mode (props.cityMode): /colleges/[city] — ALL colleges in a city,
 *    course not forced; the "Course" filter narrows by the city's courses.
 */
export default function Listing(props: { city?: string; cityMode?: boolean }) {
  const params = useParams();
  const [sp, setSp] = useSearchParams();
  const cityMode = () => !!props.cityMode;
  const parsed = () => parseListingSlug(params.listing);
  const stream = () => (cityMode() ? "" : params.stream ?? "");
  const city = () => (cityMode() ? props.city ?? "" : parsed().city);
  /** Course slug for canonical paths/links. Empty in city mode (no forced course). */
  const baseCourse = () => (cityMode() ? "" : parsed().course || stream());

  const q = (): ListingQuery => ({
    // City mode: only send a course when the user picks one in the filter.
    course: (sp.course as string) || baseCourse() || undefined,
    city: city(),
    type: (sp.type as string) || undefined,
    exam: (sp.exam as string) || undefined,
    approval: (sp.approval as string) || undefined,
    fees_min: (sp.fees_min as string) || undefined,
    fees_max: (sp.fees_max as string) || undefined,
    sort: (sp.sort as string) || undefined,
    page: (sp.page as string) || undefined,
  });

  // deferStream only the listing data (the head + FAQPage JSON-LD depend on it).
  // cities/streams power the below-the-fold explore links, so they stay
  // non-blocking to avoid an unnecessary TTFB hit.
  const data = createAsync(() => listingQuery(q()), { deferStream: true });
  const cities = createAsync(() => citiesQuery());
  const streams = createAsync(() => streamsQuery());

  // City-mode only: the full set of colleges in the city (all pages), so the
  // on-page search can match a college by name across every page. Fetched lazily
  // on the client AFTER mount (not during SSR/navigation) so it never delays the
  // page from opening; it is only needed once the user uses the search box.
  const [allCityColleges, setAllCityColleges] = createSignal<CollegeCard[] | undefined>(undefined);
  onMount(() => {
    if (cityMode() && city()) {
      cityCollegesAction(city())
        .then(setAllCityColleges)
        .catch(() => {});
    }
  });
  const [introOpen, setIntroOpen] = createSignal(false);
  const [collegeSearch, setCollegeSearch] = createSignal("");
  const searching = () => collegeSearch().trim().length >= 1;
  const collegeMatches = () => {
    const term = collegeSearch().trim().toLowerCase();
    return (allCityColleges() ?? []).filter((c) => c.name.toLowerCase().includes(term));
  };

  return (
    <Show when={data()} fallback={<LoadingBlock label="Loading colleges" />}>
      {(d) => {
        const m = () => d().meta;
        const path = () =>
          cityMode()
            ? cityCollegesPath(city())
            : `/${params.stream}/colleges/${params.listing}`;
        // meta.course is "" in city mode; build copy that reads cleanly either way.
        // For stream-in-city pages the backend meta.course is often empty
        // (the slug carries a STREAM, e.g. "management", not a course), which
        // dropped the stream word from the H1. Fall back to the stream/course
        // from the slug so the H1/title always name both stream and city
        // ("Management Colleges in Varanasi"). City mode stays "Colleges".
        const courseName = () =>
          m().course || (baseCourse() ? humanize(baseCourse()) : "");
        const Cc = () => (courseName() ? `${courseName()} Colleges` : "Colleges");
        const cc = () => (courseName() ? `${courseName()} colleges` : "colleges");
        const crumbs = () =>
          cityMode()
            ? [
                { name: "Home", path: "/" },
                { name: `Colleges in ${m().city}`, path: path() },
              ]
            : [
                { name: "Home", path: "/" },
                { name: courseName(), path: `/${params.stream}` },
                { name: `${cc()} in ${m().city}`, path: path() },
              ];

        const specializations = (): FilterOption[] =>
          m().popular_courses.map((c) => ({ value: c.slug, label: c.name }));

        const page = () => d().pagination.page;
        const pageSize = () => d().pagination.page_size;
        const total = () => d().pagination.total;
        const totalPages = () => Math.max(1, Math.ceil(total() / pageSize()));

        function goToPage(p: number) {
          setSp({ page: p > 1 ? String(p) : undefined });
        }

        return (
          <>
            <Seo
              title={`${Cc()} in ${m().city}: Fees, Admission and Ranking`}
              description={`Compare ${m().total_colleges} ${cc()} in ${m().city}${m().fee_range ? ` by fees (${m().fee_range})` : ""}, by approvals, accepted exams and student rating. Filter by course, type and budget to shortlist the right institute.`}
              canonical={path()}
              jsonLd={
                d().faqs.length
                  ? [breadcrumbLd(crumbs()), faqLd(d().faqs)]
                  : [breadcrumbLd(crumbs())]
              }
            />

            {/* Hero: text composed INTO the banner artwork. A scrim colour-matched
                to the banner's light pink blends left-to-right so the dark text
                reads as part of the design, not a card pasted on top. */}
            <section class="relative overflow-hidden bg-[#fbe9ee]">
              <img
                src="/college-banner.png"
                alt=""
                aria-hidden="true"
                class="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                class="absolute inset-0 bg-gradient-to-r from-[#fbe9ee] from-20% via-[#fbe9ee]/70 to-transparent"
              />
              <div class="container-x relative z-10 py-10 md:py-16">
                <div class="max-w-xl">
                  <Breadcrumbs crumbs={crumbs()} />
                  <h1 class="mt-3 text-3xl font-extrabold leading-tight text-[var(--color-ink)] md:text-4xl">
                    {Cc()} in {m().city}
                  </h1>
                  <div aria-hidden="true" class="mt-3 h-1 w-14 rounded-full bg-primary-600" />
                  <p
                    class="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-ink)]/75 md:text-[15px]"
                    classList={{ "line-clamp-2": !introOpen() }}
                  >
                    {m().intro ||
                      `There are ${m().total_colleges} ${cc()} in ${m().city}. Find details such as courses, fees, admissions, cutoffs, placements, rankings and student ratings, then shortlist by budget and the course you want to pursue.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIntroOpen((v) => !v)}
                    class="mt-2 text-sm font-semibold text-primary-700 hover:underline"
                  >
                    {introOpen() ? "Show less" : "Read more"}
                  </button>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <span class="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-white/70 px-3 py-1.5 text-sm backdrop-blur-sm">
                      <span class="font-bold text-primary-700">{m().total_colleges}</span>
                      colleges
                    </span>
                    <Show when={m().fee_range}>
                      <span class="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-white/70 px-3 py-1.5 text-sm backdrop-blur-sm">
                        Fees <span class="font-semibold">{m().fee_range}</span>
                      </span>
                    </Show>
                    <For each={m().popular_courses.slice(0, 3)}>
                      {(pc) => (
                        <span class="inline-flex items-center rounded-full border border-primary-100 bg-white/60 px-3 py-1.5 text-sm backdrop-blur-sm">
                          {pc.name}
                        </span>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </section>

            {/* Body: filter rail + results + guidance rail */}
            <div class="container-x py-6">
              <div class="grid gap-6 lg:grid-cols-[15rem_1fr] xl:grid-cols-[15rem_1fr_17rem]">
                {/* Filters: collapsible on mobile, sticky sidebar on desktop */}
                <div>
                  <details class="lg:hidden mb-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)]">
                    <summary class="cursor-pointer px-4 py-3 font-semibold list-none">
                      Filters
                    </summary>
                    <div class="px-4 pb-4">
                      <FilterRail
                        filters={d().filters}
                        specializations={specializations()}
                        specializationLabel={cityMode() ? "Course" : "Specialisation"}
                        cityName={m().city}
                      />
                    </div>
                  </details>
                  <div class="hidden lg:block lg:sticky lg:top-20 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
                    <FilterRail
                      filters={d().filters}
                      specializations={specializations()}
                      specializationLabel={cityMode() ? "Course" : "Specialisation"}
                      cityName={m().city}
                    />
                  </div>
                </div>

                {/* Results */}
                <div class="min-w-0">
                  {/* City-wide college search: matches a college by name across
                      EVERY page (filters the full city list, not just this page). */}
                  <Show when={cityMode()}>
                    <label class="relative mb-4 block">
                      <span
                        aria-hidden="true"
                        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                      >
                        ⌕
                      </span>
                      <input
                        type="search"
                        value={collegeSearch()}
                        onInput={(e) => setCollegeSearch(e.currentTarget.value)}
                        placeholder={`Search colleges in ${m().city} by name`}
                        aria-label={`Search colleges in ${m().city} by name`}
                        class="w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary-500"
                      />
                      <Show when={collegeSearch()}>
                        <button
                          type="button"
                          aria-label="Clear search"
                          onClick={() => setCollegeSearch("")}
                          class="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-[var(--color-muted)] hover:bg-primary-50 hover:text-primary-700"
                        >
                          ×
                        </button>
                      </Show>
                    </label>
                  </Show>

                  <div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3">
                    <p class="text-sm text-[var(--color-muted)]">
                      <Show
                        when={searching()}
                        fallback={
                          <>
                            <span class="font-bold text-[var(--color-ink)]">{total()}</span> results
                            {" · "}
                            {cc()} in {m().city}
                          </>
                        }
                      >
                        <span class="font-bold text-[var(--color-ink)]">{collegeMatches().length}</span>{" "}
                        {collegeMatches().length === 1 ? "college" : "colleges"} matching "
                        {collegeSearch().trim()}"
                      </Show>
                    </p>
                    <Show when={!searching()}>
                      <label class="flex items-center gap-2 text-sm">
                        <span class="text-[var(--color-muted)]">Sort by</span>
                        <div class="relative">
                          <select
                            value={(sp.sort as string) ?? "relevance"}
                            onChange={(e) =>
                              setSp({
                                sort:
                                  e.currentTarget.value === "relevance"
                                    ? undefined
                                    : e.currentTarget.value,
                                page: undefined,
                              })
                            }
                            class="appearance-none rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-3 pr-8 text-sm font-medium outline-none focus:border-primary-500"
                          >
                            <option value="relevance">Popularity</option>
                            <option value="fees">Fees: low to high</option>
                            <option value="rating">Rating</option>
                          </select>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden="true">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </label>
                    </Show>
                  </div>

                  {/* Search view (across all pages) vs the normal paginated view. */}
                  <Show
                    when={searching()}
                    fallback={
                      <Show
                        when={d().results.length}
                        fallback={
                          <EmptyState title="No colleges match these filters">
                            <p>
                              Try widening the fee range or clearing a filter to see more results.
                            </p>
                            <div class="mt-4 flex flex-wrap justify-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setSp({
                                    course: undefined,
                                    type: undefined,
                                    exam: undefined,
                                    approval: undefined,
                                    fees_min: undefined,
                                    fees_max: undefined,
                                    sort: undefined,
                                    page: undefined,
                                  })
                                }
                                class="inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] text-sm px-4 py-2.5 border border-primary-600 text-primary-700 hover:bg-primary-50"
                              >
                                Clear all filters
                              </button>
                              <A
                                href={cityMode() ? "/" : `/${params.stream}`}
                                class="inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] text-sm px-4 py-2.5 text-primary-700 hover:bg-primary-50"
                              >
                                {cityMode() ? "Back to home" : `Browse ${courseName()} by city`}
                              </A>
                            </div>
                          </EmptyState>
                        }
                      >
                        <div class="space-y-3">
                          <For each={d().results}>{(c) => <CollegeListRow college={c} />}</For>
                        </div>
                      </Show>
                    }
                  >
                    <Show
                      when={collegeMatches().length}
                      fallback={
                        <EmptyState title="No college found">
                          No college in {m().city} matches "{collegeSearch().trim()}". Check the
                          spelling, or clear the search to see all colleges.
                        </EmptyState>
                      }
                    >
                      <div class="space-y-3">
                        <For each={collegeMatches()}>{(c) => <CollegeListRow college={c} />}</For>
                      </div>
                    </Show>
                  </Show>

                  {/* Pagination (hidden while searching, which spans all pages) */}
                  <Show when={!searching() && totalPages() > 1}>
                    <nav
                      aria-label="Pagination"
                      class="mt-8 flex items-center justify-center gap-2"
                    >
                      <button
                        type="button"
                        class="px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-line)] disabled:opacity-40"
                        disabled={page() <= 1}
                        onClick={() => goToPage(page() - 1)}
                      >
                        Previous
                      </button>
                      <For each={Array.from({ length: totalPages() }, (_, i) => i + 1)}>
                        {(p) => (
                          <button
                            type="button"
                            aria-current={p === page() ? "page" : undefined}
                            onClick={() => goToPage(p)}
                            class="w-9 h-9 text-sm rounded-[var(--radius-md)] border"
                            classList={{
                              "bg-primary-600 text-white border-primary-600": p === page(),
                              "border-[var(--color-line)]": p !== page(),
                            }}
                          >
                            {p}
                          </button>
                        )}
                      </For>
                      <button
                        type="button"
                        class="px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-line)] disabled:opacity-40"
                        disabled={page() >= totalPages() && !d().pagination.has_next}
                        onClick={() => goToPage(page() + 1)}
                      >
                        Next
                      </button>
                    </nav>
                  </Show>

                  {/* Page-level lead form. Category guidance, never "apply to college X". */}
                  <Card class="mt-10 p-5 sm:p-6 bg-primary-50 border-primary-100">
                    <LeadForm
                      sourcePage={path()}
                      courseInterest={cityMode() ? undefined : m().course}
                      citySlug={city()}
                      heading={`Get details and compare ${cc()} in ${m().city}`}
                    />
                  </Card>

                  {/* Supporting content: things to know */}
                  <section class="mt-10">
                    <h2 class="text-2xl font-bold mb-4">
                      Things to know about {cc()} in {m().city}
                    </h2>
                    <div class="space-y-3 text-[var(--color-ink)]/90">
                      <p>
                        {m().city} offers a mix of government, private and deemed institutes
                        {courseName() ? ` for ${courseName()}` : " across courses"}.
                        {m().fee_range ? ` Fees in this list span ${m().fee_range} for the full programme.` : ""}{" "}
                        Shortlist by both
                        budget and the {cityMode() ? "courses" : "specialisations"} you want to
                        pursue.
                      </p>
                      <p>
                        Use the filters to narrow by college type, accepted entrance exam and
                        approval body such as AICTE, UGC or NAAC. Approval and accreditation are
                        a useful first check on quality before you compare placements and
                        rankings on each college page.
                      </p>
                      <p>
                        Fee figures here are indicative and compiled for comparison. Always
                        confirm the current fee, eligibility and admission dates with the
                        institute before taking any decision.
                      </p>
                    </div>
                  </section>

                  {/* FAQ with FAQPage schema (emitted via Seo above) */}
                  <Show when={d().faqs.length}>
                    <section class="mt-10">
                      <Faq items={d().faqs} />
                    </section>
                  </Show>
                </div>

                {/* Right rail: guidance CTA (xl+). Category-level guidance (compliance 2). */}
                <aside class="hidden xl:block">
                  {/* Glassmorphism recommendations card with illustration */}
                  <div class="sticky top-20 overflow-hidden rounded-[var(--radius-xl)] border border-white/60 bg-white/55 p-6 text-center shadow-2xl shadow-primary-900/10 ring-1 ring-black/5 backdrop-blur-2xl">
                    <div aria-hidden="true" class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-200/40 blur-2xl" />
                    <img
                      src="/vector.png"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      class="relative mx-auto h-36 w-auto object-contain"
                    />
                    <h3 class="relative mt-3 text-base font-bold text-[var(--color-ink)]">
                      Get personalised recommendations
                    </h3>
                    <p class="relative mt-1.5 text-sm text-[var(--color-muted)]">
                      Tell us your preferences and our advisors shortlist {m().city} colleges by
                      fees, cutoffs and placements. Free for students.
                    </p>
                    <div class="relative mt-4">
                      <LeadTrigger
                        sourcePage={path()}
                        citySlug={city()}
                        label="Talk to an advisor"
                        variant="primary"
                        class="w-full justify-center"
                      />
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            {/* Full-width: explore other courses and cities */}
            <Section bg="canvas">
              <Show when={streams()}>
                {(ss) => (
                  <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-accent-600">
                      Keep exploring
                    </span>
                    <h2 class="mt-2 text-2xl font-extrabold">
                      Other courses in {m().city}
                    </h2>
                    <p class="mt-2 text-[var(--color-muted)]">
                      Browse colleges for other streams in {m().city}.
                    </p>
                    <div class="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      <For each={ss().filter((s) => s.slug !== params.stream)}>
                        {(s) => (
                          <A
                            href={listingPath(s.slug, s.slug, city())}
                            class="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 transition-all hover:border-primary-300 hover:shadow-sm hover:-translate-y-0.5"
                          >
                            <span class="grid place-items-center w-10 h-10 shrink-0 rounded-[var(--radius-md)] bg-primary-50">
                              <StreamIcon slug={s.slug} class="text-xl" />
                            </span>
                            <span class="min-w-0 flex-1">
                              <span class="block text-sm font-semibold truncate group-hover:text-primary-700">
                                {s.name}
                              </span>
                              <span class="block text-xs text-[var(--color-muted)]">
                                Colleges in {m().city}
                              </span>
                            </span>
                            <span
                              aria-hidden="true"
                              class="text-primary-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600"
                            >
                              →
                            </span>
                          </A>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </Show>

              <Show when={cities()}>
                {(cs) => (
                  <div class="mt-10">
                    <h3 class="text-lg font-bold">
                      {cityMode() ? "Colleges in other cities" : `${cc()} in other cities`}
                    </h3>
                    <div class="mt-4 flex flex-wrap gap-2.5">
                      <For each={cs().filter((c) => c.slug !== city())}>
                        {(c) => (
                          <A
                            href={
                              cityMode()
                                ? cityCollegesPath(c.slug)
                                : listingPath(stream(), baseCourse(), c.slug)
                            }
                            class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:border-primary-300 hover:text-primary-700 transition-colors"
                          >
                            <span aria-hidden="true" class="text-accent-500">
                              ◉
                            </span>
                            {cityMode() ? `Colleges in ${c.name}` : `${courseName()} in ${c.name}`}
                          </A>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </Show>
            </Section>
          </>
        );
      }}
    </Show>
  );
}
