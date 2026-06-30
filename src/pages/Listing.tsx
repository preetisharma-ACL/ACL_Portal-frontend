import { A, createAsync, useParams, useSearchParams } from "@solidjs/router";
import { For, Show, createSignal, onMount } from "solid-js";
import Seo from "~/components/Seo";
import CollegeListRow from "~/components/CollegeListRow";
import CollegeLogo from "~/components/CollegeLogo";
import FilterRail from "~/components/FilterRail";
import Faq from "~/components/Faq";
import LeadForm from "~/components/LeadForm";
import StreamIcon from "~/components/StreamIcon";
import { Card, Section } from "~/components/ui";
import { EmptyState, LoadingBlock } from "~/components/states";
import { citiesQuery, listingQuery, streamsQuery } from "~/lib/queries";
import { cityCollegesAction } from "~/lib/actions";
import { cityCollegesPath, humanize, listingPath, parseListingSlug } from "~/lib/slug";
import { breadcrumbLd, faqLd } from "~/lib/jsonld";
import { CONTACT_PHONE_TEL } from "~/lib/config";
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

  // Hero banner: a city-specific image where we have one, else the default.
  const CITY_BANNERS: Record<string, string> = {
    varanasi: "/varanasi-banner.png",
  };
  const bannerSrc = () => CITY_BANNERS[city().toLowerCase()] ?? "/college-banner.png";
  // City-specific banners are finished artwork — show them clean, with no scrim.
  const hasCityBanner = () => !!CITY_BANNERS[city().toLowerCase()];

  // Editorial "best college" picks per city, surfaced as a highlight strip under
  // the hero. tone: "gov" (government, red) / "private" (accent).
  const CITY_TOP_PICKS: Record<
    string,
    { id: number; slug: string; name: string; label: string; tone: "gov" | "private"; logo: string }[]
  > = {
    varanasi: [
      {
        id: 144,
        slug: "banaras-hindu-university-varanasi",
        name: "Banaras Hindu University",
        label: "Best Government College",
        tone: "gov",
        logo: "/bhu.png",
      },
      {
        id: 168,
        slug: "school-of-management-sciences-varanasi-varanasi",
        name: "School of Management Sciences, Varanasi",
        label: "Best Private College",
        tone: "private",
        logo: "/sms.webp",
      },
    ],
  };
  const topPicks = () => CITY_TOP_PICKS[city().toLowerCase()] ?? [];

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

            {/* Hero. Mobile: full banner image on top, title + chips stacked
                below it. Desktop (sm+): image as a cover background with the soft
                scrim and centered content overlaid. */}
            <section class="relative overflow-hidden sm:bg-[#fbe9ee]">
              {/* Mobile: full image, not cropped */}
              <img
                src={bannerSrc()}
                alt=""
                class="block w-full sm:hidden"
              />
              {/* Desktop: image as cover background */}
              <img
                src={bannerSrc()}
                alt=""
                aria-hidden="true"
                class="absolute inset-0 hidden h-full w-full object-cover object-center sm:block"
              />
              {/* Soft scrim for the default banner only; city artwork shows clean. */}
              <Show when={!hasCityBanner()}>
                <div
                  aria-hidden="true"
                  class="absolute inset-0 hidden bg-gradient-to-r from-[#fbe9ee]/70 via-[#fbe9ee]/30 to-transparent sm:block"
                />
              </Show>
              <div class="container-x relative z-10 py-6 text-center sm:py-16 md:py-28">
                <h1
                  class="text-2xl font-extrabold tracking-tight md:text-3xl"
                  classList={{
                    "text-accent-600": !hasCityBanner(),
                    "text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]": hasCityBanner(),
                  }}
                >
                  {Cc()} in {m().city}
                </h1>
                <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span class="inline-flex items-center rounded-full bg-accent-500 px-3.5 py-1 text-[13px] font-semibold text-white shadow-sm">
                    {m().total_colleges} colleges
                  </span>
                  <For each={m().popular_courses.slice(0, 3)}>
                    {(pc) => (
                      <span class="inline-flex items-center rounded-full border border-accent-100 bg-white/75 px-3.5 py-1 text-[13px] font-medium text-accent-700 backdrop-blur-sm">
                        {pc.name}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </section>

            {/* Editorial "best college" picks for this city — a sparkly highlight
                strip. */}
            <Show when={topPicks().length}>
              <div class="container-x pt-6 md:pt-8">
                <div class="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-r from-primary-50 via-[#fff7fb] to-accent-50 px-5 py-5 ring-1 ring-black/5 sm:px-7">
                  {/* decorative sparkles */}
                  <span aria-hidden="true" class="pointer-events-none absolute right-4 top-3 select-none text-lg opacity-70">✨</span>
                  <span aria-hidden="true" class="pointer-events-none absolute bottom-3 right-10 select-none text-sm opacity-50">✨</span>

                  <div class="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
                    <For each={topPicks()}>
                      {(p, i) => (
                        <>
                          <Show when={i() > 0}>
                            <span aria-hidden="true" class="hidden w-px self-stretch bg-[var(--color-line)] sm:block" />
                          </Show>
                          <A
                            href={`/college/${p.slug}-${p.id}`}
                            class="group flex flex-1 items-center gap-3"
                          >
                            {/* College logo with a sparkling "best" indicator */}
                            <span class="relative shrink-0">
                              <span
                                class="grid h-14 w-14 place-items-center rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-2 shadow-sm ring-1 ring-black/5"
                              >
                                <CollegeLogo
                                  name={p.name}
                                  logo={p.logo}
                                  id={p.id}
                                  class="max-h-full max-w-full text-sm"
                                />
                              </span>
                              {/* Twinkling sparkle marking the best pick */}
                              <span
                                aria-hidden="true"
                                class="pointer-events-none absolute -right-2 -top-2 animate-pulse select-none text-base drop-shadow"
                              >
                                ✨
                              </span>
                            </span>
                            <span class="min-w-0">
                              <span
                                class="block text-[11px] font-bold uppercase tracking-wide"
                                classList={{
                                  "text-primary-700": p.tone === "gov",
                                  "text-accent-600": p.tone === "private",
                                }}
                              >
                                {p.label}
                              </span>
                              <span class="block truncate font-bold text-[var(--color-ink)] group-hover:text-primary-700">
                                {p.name}
                              </span>
                            </span>
                            {/* Sparkling finger pointing back at the best college */}
                            <span aria-hidden="true" class="ml-auto flex shrink-0 items-center gap-0.5">
                              <span class="animate-pulse select-none text-sm">✨</span>
                              <span class="select-none text-xl transition-transform group-hover:-translate-x-0.5">👈</span>
                            </span>
                          </A>
                        </>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </Show>

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
                      <a
                        href={`tel:${CONTACT_PHONE_TEL}`}
                        class="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 px-4 py-3 text-base font-bold text-white transition-all duration-150 hover:-translate-y-0.5 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 shrink-0" aria-hidden="true">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                        </svg>
                        Call Now
                      </a>
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
                    <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
