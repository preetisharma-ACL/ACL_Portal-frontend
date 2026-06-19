import { A, createAsync, type RouteDefinition } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import HeroSearch from "~/components/HeroSearch";
import HeroSlider from "~/components/HeroSlider";
import StreamIcon from "~/components/StreamIcon";
import StreamExplorer from "~/components/StreamExplorer";
import CollegeCardItem from "~/components/CollegeCardItem";
import LeadTrigger from "~/components/LeadTrigger";
import { Card, LinkButton, Section } from "~/components/ui";
import { SITE_NAME, OPERATOR_DISCLOSURE } from "~/lib/config";
import { homeQuery } from "~/lib/queries";
import { listingPath } from "~/lib/slug";
import { organizationLd, websiteLd } from "~/lib/jsonld";

export const route = {
  preload: () => void homeQuery(),
} satisfies RouteDefinition;

const POPULAR_CITY_SLUGS = ["varanasi", "lucknow", "delhi-ncr", "noida", "bengaluru"];

function courseSlug(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("mba") || l.includes("pgdm")) return "mba-pgdm";
  return l.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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
      <section class="relative bg-primary-900 text-white overflow-hidden">
        {/* Crossfading background images */}
        <HeroSlider />
        {/* Minimal overlay: keeps the copy readable, left-weighted so the image
            still shows through on the right. */}
        <div
          aria-hidden="true"
          class="absolute inset-0 z-[1] bg-gradient-to-r from-primary-900/85 via-primary-900/65 to-primary-900/40"
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

            {/* Browse by popular city: dark, decorative section */}
            <section class="relative overflow-hidden bg-primary-900 text-white">
              {/* Decorative shapes using both brand colors */}
              <div
                aria-hidden="true"
                class="pointer-events-none absolute -top-28 -left-24 w-80 h-80 rounded-full bg-primary-500/25 blur-3xl"
              />
              <div
                aria-hidden="true"
                class="pointer-events-none absolute -bottom-28 -right-20 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                class="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
              />

              <div class="container-x py-14 md:py-16 relative z-10">
                <div class="max-w-2xl mb-8">
                  <span class="inline-block text-xs font-semibold uppercase tracking-wider text-accent-400">
                    Explore by location
                  </span>
                  <h2 class="mt-2 text-2xl md:text-3xl font-extrabold text-white">
                    Browse by popular city
                  </h2>
                  <p class="mt-2 text-white/70">
                    Discover top colleges in India's leading education hubs.
                  </p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <For each={d().cities.filter((c) => POPULAR_CITY_SLUGS.includes(c.slug))}>
                    {(city) => (
                      <A
                        href={listingPath("mba", "mba", city.slug)}
                        class="group relative overflow-hidden rounded-[var(--radius-xl)] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent-400/50 hover:bg-white/10"
                      >
                        {/* Corner accent glow */}
                        <div
                          aria-hidden="true"
                          class="pointer-events-none absolute -right-6 -top-6 w-20 h-20 rounded-full bg-accent-500/20 blur-xl transition-colors group-hover:bg-accent-500/40"
                        />
                        <div class="relative flex items-center justify-between">
                          <span class="grid place-items-center w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm ring-1 ring-white/10">
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
                          <span
                            aria-hidden="true"
                            class="text-white/40 transition-all group-hover:text-accent-400 group-hover:translate-x-0.5"
                          >
                            →
                          </span>
                        </div>
                        <span class="relative mt-4 block font-bold text-lg text-white">
                          {city.name}
                        </span>
                        <span class="relative block text-sm text-accent-400 font-medium">
                          {city.college_count}+ colleges
                        </span>
                        <span class="relative mt-0.5 block text-xs text-white/50">{city.state}</span>
                      </A>
                    )}
                  </For>
                </div>
              </div>
            </section>

            {/* Top colleges */}
            <Section bg="surface">
              <div class="flex items-end justify-between mb-6">
                <h2 class="text-2xl font-bold">Top colleges</h2>
                <LinkButton
                  href={listingPath("mba", "mba", "varanasi")}
                  variant="ghost"
                  size="sm"
                >
                  View all
                </LinkButton>
              </div>
              <div class="grid gap-4 lg:grid-cols-2">
                <For each={d().topColleges}>{(c) => <CollegeCardItem college={c} />}</For>
              </div>
            </Section>

            {/* Popular courses */}
            <Section>
              <h2 class="text-2xl font-bold mb-6">Popular courses</h2>
              <div class="flex flex-wrap gap-3">
                <For each={d().popularCourses}>
                  {(label) => (
                    <A
                      href={`/${courseSlug(label)}-course`}
                      class="px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-primary-300 hover:text-primary-700 font-medium"
                    >
                      {label}
                    </A>
                  )}
                </For>
              </div>
            </Section>

            {/* Trust band */}
            <section class="bg-primary-900 text-white">
              <div class="container-x py-12">
                <div class="grid gap-8 md:grid-cols-2 items-center">
                  <div>
                    <h2 class="text-2xl font-bold text-white">
                      One place to compare your options
                    </h2>
                    <p class="mt-3 text-white/80">
                      {SITE_NAME} is an independent discovery platform. We bring colleges, courses
                      and exams together with comparable information so you can shortlist with
                      clarity. We do not run admissions for any institution.
                    </p>
                    <div class="mt-6 flex gap-8">
                      <div>
                        <div class="text-3xl font-extrabold">{d().counts.colleges}+</div>
                        <div class="text-sm text-white/70">colleges</div>
                      </div>
                      <div>
                        <div class="text-3xl font-extrabold">{d().counts.courses}+</div>
                        <div class="text-sm text-white/70">courses</div>
                      </div>
                      <div>
                        <div class="text-3xl font-extrabold">{d().counts.cities}</div>
                        <div class="text-sm text-white/70">cities</div>
                      </div>
                    </div>
                    <p class="mt-6 text-xs text-white/60">{OPERATOR_DISCLOSURE}</p>
                  </div>

                  <Card class="p-6 text-[var(--color-ink)]">
                    <h3 class="text-xl font-bold">Need help deciding?</h3>
                    <p class="mt-2 text-[var(--color-muted)]">
                      Get free, no obligation guidance on shortlisting colleges and courses that
                      fit your goals.
                    </p>
                    <div class="mt-5">
                      <LeadTrigger
                        sourcePage="/"
                        label="Get free admission guidance"
                        size="lg"
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
