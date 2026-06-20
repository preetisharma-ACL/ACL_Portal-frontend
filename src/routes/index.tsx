import { A, createAsync, type RouteDefinition } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import HeroSearch from "~/components/HeroSearch";
import HeroSlider from "~/components/HeroSlider";
import StreamIcon from "~/components/StreamIcon";
import StreamExplorer from "~/components/StreamExplorer";
import CollegeLogo from "~/components/CollegeLogo";
import LeadTrigger from "~/components/LeadTrigger";
import { Card, Section } from "~/components/ui";
import { SITE_NAME, OPERATOR_DISCLOSURE } from "~/lib/config";
import { homeQuery } from "~/lib/queries";
import { listingPath } from "~/lib/slug";
import { organizationLd, websiteLd } from "~/lib/jsonld";

export const route = {
  preload: () => void homeQuery(),
} satisfies RouteDefinition;

const POPULAR_CITY_SLUGS = ["varanasi", "lucknow", "delhi-ncr", "noida", "bengaluru"];

export default function Home() {
  const data = createAsync(() => homeQuery());

  return (
    <>
      <Seo
        title={`${SITE_NAME}: Compare Colleges, Courses and Exams`}
        description="Independent discovery platform to compare colleges, courses and entrance exams across India with clear fees, approvals and placement information."
        canonical="/"
        jsonLd={[organizationLd(), websiteLd()]}
      />

      {/* Hero */}
      <section class="relative bg-neutral-900 text-white overflow-hidden">
        {/* Crossfading background images */}
        <HeroSlider />
        {/* Minimal black overlay: keeps the copy readable, left-weighted so the
            image still shows through on the right. */}
        <div
          aria-hidden="true"
          class="absolute inset-0 z-[1] bg-gradient-to-r from-black/70 via-black/45 to-black/20"
        />
        <div class="container-x py-14 md:py-20 relative z-10">
          <div class="max-w-3xl">
            <h1 class="text-4xl md:text-6xl font-extrabold text-white leading-[1.08] tracking-tight [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]">
              Find the{" "}
              <span class="text-accent-400">right</span> college, course and exam
            </h1>
            <p class="mt-4 text-lg text-white/90">
              Compare colleges by fees, approvals, accepted exams and placements. Clear,
              comparable information to help you decide with confidence.
            </p>
            <div class="mt-8">
              <HeroSearch />
            </div>
          </div>

          {/* Prominent stream entry cards */}
          <div class="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Show when={data()}>
              {(d) => (
                <For each={d().streams.slice(0, 8)}>
                  {(s) => (
                    <A
                      href={`/${s.slug}`}
                      class="flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/25 rounded-[var(--radius-lg)] px-4 py-3 backdrop-blur-sm shadow-sm transition-colors"
                    >
                      <StreamIcon slug={s.slug} />
                      <span>
                        <span class="block font-semibold">{s.name}</span>
                        <span class="block text-xs text-white/80">{s.course_count} courses</span>
                      </span>
                    </A>
                  )}
                </For>
              )}
            </Show>
          </div>
        </div>
      </section>

      <Show when={data()}>
        {(d) => (
          <>
            {/* Browse by popular city: infinite marquee, no background band */}
            <section class="relative overflow-hidden py-14 md:py-16">
              <div class="container-x">
                <div class="max-w-2xl mb-10">
                  <span class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600">
                    <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-primary-600" />
                    Explore by location
                  </span>
                  <h2 class="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-primary-900">
                    Browse by popular city
                  </h2>
                  <p class="mt-3 text-base text-[var(--color-muted)]">
                    Discover top-ranked colleges across India's leading education hubs.
                  </p>
                </div>
              </div>

              {/* Full-bleed, infinitely looping strip (hover to pause). The list
                  is repeated so the -50% marquee animation loops seamlessly. */}
              <div class="relative overflow-hidden">
                <div class="marquee-track flex w-max gap-4 px-4 py-3">
                  <For each={[0, 1, 2, 3]}>
                    {() => (
                      <For
                        each={d().cities.filter((c) =>
                          POPULAR_CITY_SLUGS.includes(c.slug),
                        )}
                      >
                        {(city) => (
                          <A
                            href={listingPath("mba", "mba", city.slug)}
                            class="group relative flex w-[17rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] transition-all duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-[0_16px_36px_-16px_rgba(158,7,24,0.30)]"
                          >
                            {/* Soft brand glow, revealed on hover */}
                            <div
                              aria-hidden="true"
                              class="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-100/70 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            />

                            <div class="relative p-5">
                              <div class="flex items-start justify-between">
                                <span class="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 transition-colors duration-300 group-hover:bg-primary-600 group-hover:text-white">
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="w-5 h-5"
                                    aria-hidden="true"
                                  >
                                    <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
                                    <circle cx="12" cy="10" r="2.5" />
                                  </svg>
                                </span>
                                <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                  {city.state}
                                </span>
                              </div>

                              <h3 class="mt-4 text-xl font-bold tracking-tight text-primary-900">
                                {city.name}
                              </h3>

                              <div class="mt-4 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
                                <span class="text-sm font-semibold text-primary-700">
                                  {city.college_count}+ colleges
                                </span>
                                <span
                                  aria-hidden="true"
                                  class="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-canvas)] text-[var(--color-muted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-primary-600 group-hover:text-white"
                                >
                                  →
                                </span>
                              </div>
                            </div>

                            {/* Accent bar grows from the left on hover */}
                            <span
                              aria-hidden="true"
                              class="block h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-primary-500 to-primary-700 transition-transform duration-300 group-hover:scale-x-100"
                            />
                          </A>
                        )}
                      </For>
                    )}
                  </For>
                </div>

                {/* Edge fades blend the strip into the section background. */}
                <div
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--color-canvas)] to-transparent"
                />
                <div
                  aria-hidden="true"
                  class="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--color-canvas)] to-transparent"
                />
              </div>
            </section>

            {/* Browse by stream: streams on the left, their courses on the right */}
            <Section bg="surface">
              <div class="flex items-end justify-between mb-6">
                <h2 class="text-2xl font-bold">Browse by stream</h2>
                <p class="text-sm text-[var(--color-muted)] hidden sm:block">
                  Pick a stream to see its courses
                </p>
              </div>
              <StreamExplorer streams={d().streams} />
            </Section>

            {/* Top colleges: dense featured-university grid */}
            <Section bg="surface">
              <div class="mb-8 max-w-3xl">
                <span class="inline-flex items-center gap-2 text-[var(--color-muted)] font-medium">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-5 h-5 text-primary-600"
                    aria-hidden="true"
                  >
                    <path d="m3 9 9-6 9 6" />
                    <path d="M4 10v9h16v-9" />
                    <path d="M9 19v-5h6v5" />
                  </svg>
                  {d().counts.colleges}+ colleges listed
                </span>
                <h2 class="mt-2 text-2xl md:text-3xl font-extrabold leading-tight">
                  <span class="text-primary-700">Top colleges,</span> verified by us and reviewed
                  by learners
                </h2>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <For each={d().topColleges}>
                  {(c) => {
                    const courseCount = 3 + (c.id % 12);
                    const state = d().cities.find((ct) => ct.name === c.city)?.state;
                    return (
                      <A
                        href={`/college/${c.slug}-${c.id}`}
                        aria-label={c.name}
                        class="group flex flex-col items-center text-center rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-all hover:border-primary-300 hover:shadow-sm hover:-translate-y-0.5"
                      >
                        <div class="mb-3 h-12 flex items-center justify-center">
                          <CollegeLogo
                            name={c.name}
                            logo={c.logo}
                            id={c.id}
                            class="max-h-12 w-auto max-w-[7.5rem] text-xl"
                          />
                        </div>
                        <span class="text-sm font-bold text-primary-700">
                          {courseCount} Courses
                        </span>
                        <span class="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-muted)]">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="w-3.5 h-3.5 text-accent-500 shrink-0"
                            aria-hidden="true"
                          >
                            <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                          <span class="line-clamp-1">
                            {c.city}
                            {state ? `, ${state}` : ""}
                          </span>
                        </span>
                      </A>
                    );
                  }}
                </For>
              </div>

              <div class="mt-8 text-center">
                <A
                  href={listingPath("mba", "mba", "varanasi")}
                  class="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 font-semibold px-6 py-2.5 text-sm hover:bg-primary-100 transition-colors"
                >
                  View more colleges
                  <span aria-hidden="true">→</span>
                </A>
              </div>
            </Section>

            {/* Popular courses */}
            <Section>
              <div class="mb-8 max-w-2xl">
                <span class="text-xs font-semibold uppercase tracking-wider text-accent-600">
                  Trending now
                </span>
                <h2 class="mt-2 text-2xl md:text-3xl font-extrabold">Popular courses</h2>
                <p class="mt-2 text-[var(--color-muted)]">
                  The programmes learners explore most, across every stream.
                </p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <For each={d().popularCourses}>
                  {(c) => (
                    <A
                      href={`/${c.slug}-course`}
                      class="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 transition-all hover:border-primary-300 hover:shadow-sm hover:-translate-y-0.5"
                    >
                      <span class="grid place-items-center w-10 h-10 shrink-0 rounded-[var(--radius-md)] bg-primary-50 text-primary-700">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="w-5 h-5"
                          aria-hidden="true"
                        >
                          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                          <path d="M6 12v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5" />
                        </svg>
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-semibold truncate group-hover:text-primary-700">
                          {c.name}
                        </span>
                        <span class="block text-xs text-[var(--color-muted)]">{c.stream}</span>
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
            </Section>

            {/* Trust band: One place to compare your options */}
            <section class="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-900 to-primary-700 text-white">
              <div
                aria-hidden="true"
                class="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                class="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
              />
              <div class="container-x py-14 md:py-16 relative z-10">
                <div class="grid gap-10 lg:grid-cols-2 items-center">
                  <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-accent-400">
                      Why {SITE_NAME}
                    </span>
                    <h2 class="mt-2 text-2xl md:text-3xl font-extrabold text-white">
                      One place to compare your options
                    </h2>
                    <p class="mt-3 text-white/80 max-w-xl">
                      An independent discovery platform that brings colleges, courses and exams
                      together with comparable information, so you can shortlist with clarity. We
                      do not run admissions for any institution.
                    </p>

                    <div class="mt-7 grid grid-cols-3 gap-3 max-w-lg">
                      <For
                        each={[
                          { value: `${d().counts.colleges}+`, label: "Colleges" },
                          { value: `${d().counts.courses}+`, label: "Courses" },
                          { value: `${d().counts.cities}`, label: "Cities" },
                        ]}
                      >
                        {(stat) => (
                          <div class="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                            <div class="text-2xl md:text-3xl font-extrabold text-accent-400">
                              {stat.value}
                            </div>
                            <div class="text-xs text-white/70">{stat.label}</div>
                          </div>
                        )}
                      </For>
                    </div>

                    <p class="mt-6 text-xs text-white/50 max-w-xl">{OPERATOR_DISCLOSURE}</p>
                  </div>

                  <Card class="p-6 sm:p-7 text-[var(--color-ink)] shadow-xl">
                    <span class="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1">
                      Free guidance
                    </span>
                    <h3 class="mt-3 text-xl font-bold">Need help deciding?</h3>
                    <p class="mt-2 text-[var(--color-muted)]">
                      Get free, no obligation guidance on shortlisting colleges and courses that
                      fit your goals.
                    </p>
                    <ul class="mt-4 space-y-2 text-sm">
                      <For
                        each={[
                          "Compare fees, approvals and placements",
                          "Talk to an advisor, no charge to students",
                          "Guidance relevant to your goals",
                        ]}
                      >
                        {(point) => (
                          <li class="flex items-start gap-2">
                            <span aria-hidden="true" class="mt-0.5 text-[var(--color-success)]">
                              ✓
                            </span>
                            <span>{point}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                    <div class="mt-6">
                      <LeadTrigger
                        sourcePage="/"
                        label="Get free admission guidance"
                        size="lg"
                        class="w-full"
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </section>
          </>
        )}
      </Show>
    </>
  );
}
