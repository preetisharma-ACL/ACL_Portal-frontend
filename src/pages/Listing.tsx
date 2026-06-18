import { A, createAsync, useParams, useSearchParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeCardItem from "~/components/CollegeCardItem";
import FilterRail from "~/components/FilterRail";
import Faq from "~/components/Faq";
import LeadForm from "~/components/LeadForm";
import { Card } from "~/components/ui";
import { EmptyState, NotFound } from "~/components/states";
import { citiesQuery, listingQuery, streamsQuery } from "~/lib/queries";
import { listingPath, parseListingSlug } from "~/lib/slug";
import { breadcrumbLd, faqLd } from "~/lib/jsonld";
import type { FilterOption, ListingQuery } from "~/lib/types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Listing() {
  const params = useParams();
  const [sp, setSp] = useSearchParams();
  const parsed = () => parseListingSlug(params.listing);
  const stream = () => params.stream ?? "";
  /** Course slug used for canonical paths and related links (ignores the specialisation filter). */
  const baseCourse = () => parsed().course || stream();

  const q = (): ListingQuery => ({
    course: (sp.course as string) || baseCourse(),
    city: parsed().city,
    type: (sp.type as string) || undefined,
    exam: (sp.exam as string) || undefined,
    approval: (sp.approval as string) || undefined,
    fees_min: (sp.fees_min as string) || undefined,
    fees_max: (sp.fees_max as string) || undefined,
    sort: (sp.sort as string) || undefined,
    page: (sp.page as string) || undefined,
  });

  const data = createAsync(() => listingQuery(q()));
  const cities = createAsync(() => citiesQuery());
  const streams = createAsync(() => streamsQuery());

  return (
    <Show when={data()} fallback={<NotFound title="Listing not found" />}>
      {(d) => {
        const m = () => d().meta;
        const path = () => `/${params.stream}/colleges/${params.listing}`;
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: m().course, path: `/${params.stream}` },
          { name: `${m().course} colleges in ${m().city}`, path: path() },
        ];

        const specializations = (): FilterOption[] =>
          m().popular_courses.map((c) => ({ value: slugify(c), label: c }));

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
              title={`${m().course} Colleges in ${m().city}: Fees, Admission and Ranking`}
              description={`Compare ${m().total_colleges} ${m().course} colleges in ${m().city} by fees (${m().fee_range}), approvals, accepted exams and student rating. Filter and shortlist the right institute.`}
              canonical={path()}
              jsonLd={
                d().faqs.length
                  ? [breadcrumbLd(crumbs()), faqLd(d().faqs)]
                  : [breadcrumbLd(crumbs())]
              }
            />

            {/* Header */}
            <div class="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
              <div class="container-x py-6">
                <Breadcrumbs crumbs={crumbs()} />
                <h1 class="mt-3 text-2xl md:text-3xl font-extrabold">
                  {m().course} Colleges in {m().city}
                </h1>
                <Show when={m().intro}>
                  <p class="mt-2 max-w-3xl text-[var(--color-muted)]">{m().intro}</p>
                </Show>
                <dl class="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div class="flex items-baseline gap-2">
                    <dt class="text-[var(--color-muted)]">Colleges listed</dt>
                    <dd class="font-semibold">{m().total_colleges}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="text-[var(--color-muted)]">Fee range</dt>
                    <dd class="font-semibold">{m().fee_range}</dd>
                  </div>
                  <Show when={m().popular_courses.length}>
                    <div class="flex items-baseline gap-2">
                      <dt class="text-[var(--color-muted)]">Popular courses</dt>
                      <dd class="font-semibold">{m().popular_courses.join(", ")}</dd>
                    </div>
                  </Show>
                </dl>
              </div>
            </div>

            {/* Body: filter rail + results */}
            <div class="container-x py-8">
              <div class="grid gap-8 lg:grid-cols-[18rem_1fr]">
                {/* Filters: collapsible on mobile, sticky sidebar on desktop */}
                <div>
                  <details class="lg:hidden mb-4 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)]">
                    <summary class="cursor-pointer px-4 py-3 font-semibold list-none">
                      Filters and sort
                    </summary>
                    <div class="px-4 pb-4">
                      <FilterRail
                        filters={d().filters}
                        specializations={specializations()}
                      />
                    </div>
                  </details>
                  <div class="hidden lg:block lg:sticky lg:top-20">
                    <FilterRail filters={d().filters} specializations={specializations()} />
                  </div>
                </div>

                {/* Results */}
                <div class="min-w-0">
                  <div class="flex items-center justify-between mb-4">
                    <p class="text-sm text-[var(--color-muted)]">
                      Showing {d().results.length} of {total()}{" "}
                      {m().course} colleges in {m().city}
                    </p>
                  </div>

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
                            href={`/${params.stream}`}
                            class="inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] text-sm px-4 py-2.5 text-primary-700 hover:bg-primary-50"
                          >
                            Browse {m().course} by city
                          </A>
                        </div>
                      </EmptyState>
                    }
                  >
                    <div class="grid gap-4">
                      <For each={d().results}>{(c) => <CollegeCardItem college={c} />}</For>
                    </div>
                  </Show>

                  {/* Pagination */}
                  <Show when={totalPages() > 1}>
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
                      courseInterest={m().course}
                      defaultCity={m().city}
                      heading={`Get details and compare ${m().course} colleges in ${m().city}`}
                    />
                  </Card>

                  {/* Supporting content: things to know */}
                  <section class="mt-10">
                    <h2 class="text-2xl font-bold mb-4">
                      Things to know about {m().course} colleges in {m().city}
                    </h2>
                    <div class="space-y-3 text-[var(--color-ink)]/90">
                      <p>
                        {m().city} offers a mix of government, private and deemed institutes
                        for {m().course}. Fees in this list span {m().fee_range} for the full
                        programme, so shortlist by both budget and the specialisations you want
                        to pursue.
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

                  {/* Related internal links */}
                  <section class="mt-10 grid gap-8 sm:grid-cols-2">
                    <Show when={cities()}>
                      {(cs) => (
                        <div>
                          <h2 class="text-lg font-bold mb-3">
                            {m().course} colleges in other cities
                          </h2>
                          <ul class="space-y-2 text-sm">
                            <For
                              each={cs()
                                .filter((c) => c.slug !== parsed().city)
                                .slice(0, 6)}
                            >
                              {(c) => (
                                <li>
                                  <A
                                    href={listingPath(stream(), baseCourse(), c.slug)}
                                    class="text-primary-700 hover:underline"
                                  >
                                    {m().course} colleges in {c.name}
                                  </A>
                                </li>
                              )}
                            </For>
                          </ul>
                        </div>
                      )}
                    </Show>
                    <Show when={streams()}>
                      {(ss) => (
                        <div>
                          <h2 class="text-lg font-bold mb-3">
                            Other courses in {m().city}
                          </h2>
                          <ul class="space-y-2 text-sm">
                            <For
                              each={ss()
                                .filter((s) => s.slug !== params.stream)
                                .slice(0, 6)}
                            >
                              {(s) => (
                                <li>
                                  <A
                                    href={listingPath(s.slug, s.slug, parsed().city)}
                                    class="text-primary-700 hover:underline"
                                  >
                                    {s.name} colleges in {m().city}
                                  </A>
                                </li>
                              )}
                            </For>
                          </ul>
                        </div>
                      )}
                    </Show>
                  </section>
                </div>
              </div>
            </div>
          </>
        );
      }}
    </Show>
  );
}
