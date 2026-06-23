import { A, createAsync, type RouteDefinition } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import HeroSearch from "~/components/HeroSearch";
import HeroSlider from "~/components/HeroSlider";
import StreamIcon from "~/components/StreamIcon";
import StreamExplorer from "~/components/StreamExplorer";
import CityCarousel from "~/components/CityCarousel";
import TopCollegesCarousel from "~/components/TopCollegesCarousel";
import LeadTrigger from "~/components/LeadTrigger";
import { Card, Section } from "~/components/ui";
import { SITE_NAME, OPERATOR_DISCLOSURE } from "~/lib/config";
import { homeQuery } from "~/lib/queries";
import { organizationLd, websiteLd } from "~/lib/jsonld";
import type { Stream } from "~/lib/types";

export const route = {
  preload: () => void homeQuery(),
} satisfies RouteDefinition;

/** Stream quick-link cards. Dark glass style for the hero, light style elsewhere. */
function StreamGrid(props: { streams: Stream[]; light?: boolean }) {
  return (
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <For each={props.streams.slice(0, 8)}>
        {(s) => (
          <A
            href={`/${s.slug}`}
            class={
              props.light
                ? "flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                : "flex items-center gap-3 rounded-[var(--radius-lg)] border border-white/25 bg-white/15 px-4 py-3 backdrop-blur-sm shadow-sm hover:bg-white/25 transition-colors"
            }
          >
            <StreamIcon
              slug={s.slug}
              class={`w-6 h-6 shrink-0 ${props.light ? "text-accent-500" : "text-white"}`}
            />
            <span class="min-w-0">
              <span class="block font-semibold whitespace-nowrap">{s.name}</span>
              <span
                class={`block text-xs ${props.light ? "text-[var(--color-muted)]" : "text-white/80"}`}
              >
                {s.course_count} courses
              </span>
            </span>
          </A>
        )}
      </For>
    </div>
  );
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

      {/* Hero. No overflow-hidden on the section (it would clip the search
          suggestions dropdown); the slider is clipped by its own wrapper. z-20
          keeps the dropdown above the sections below. */}
      <section class="relative z-20 bg-neutral-900 text-white">
        {/* Crossfading background images, clipped to the hero */}
        <div aria-hidden="true" class="absolute inset-0 overflow-hidden">
          <HeroSlider />
          {/* Minimal black overlay: keeps the copy readable, left-weighted so the
              image still shows through on the right. */}
          <div class="absolute inset-0 z-[1] bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
        </div>
        <div class="container-x py-14 md:py-20 relative z-10">
          <div class="max-w-3xl">
            <h1 class="text-4xl md:text-6xl font-extrabold text-white leading-[1.08] tracking-tight [text-shadow:0_2px_18px_rgba(0,0,0,0.45)]">
              Find the{" "}
              <span class="text-yellow-600">right</span> college, course and exam
            </h1>
            <p class="mt-4 text-lg text-white/90">
              Compare colleges by fees, approvals, accepted exams and placements. Clear,
              comparable information to help you decide with confidence.
            </p>
            <div class="mt-8">
              <HeroSearch />
            </div>
          </div>  

          {/* Prominent stream entry cards: desktop only (on mobile/tablet they
              appear in their own section just below the hero) */}
          <Show when={data()}>
            {(d) => (
              <div class="mt-10 hidden lg:block">
                <StreamGrid streams={d().streams} />
              </div>
            )}
          </Show>
        </div>
      </section>

      {/* Stream quick links: mobile and tablet only, below the hero */}
      <Show when={data()}>
        {(d) => (
          <section class="lg:hidden border-b border-[var(--color-line)] bg-[var(--color-surface)]">
            <div class="container-x py-6">
              <h2 class="text-lg font-bold mb-4">Explore by stream</h2>
              <StreamGrid streams={d().streams} light />
            </div>
          </section>
        )}
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            {/* Browse by city: image-led cards in a manual carousel */}
            <CityCarousel cities={d().cities} />

            {/* Browse by stream: streams on the left, their courses on the right */}
            <Section bg="surface">
              <div class="flex items-end justify-between mb-6">
                <h2 class="text-2xl font-bold">Browse by stream</h2>
                <p class="text-sm text-[var(--color-muted)] hidden sm:block">
                  Pick a stream to see its courses
                </p>
              </div>
              <StreamExplorer streams={d().streams} coursesByStream={d().coursesByStream} />
            </Section>

            {/* Top colleges: real, named institutes in a manual carousel */}
            <TopCollegesCarousel
              colleges={d().topColleges}
              cities={d().cities}
              collegeCount={d().counts.colleges}
            />

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
            <section class="relative overflow-hidden bg-gradient-to-br from-[#011838] via-[#03204a] to-[#0c3066] text-white">
              <div
                aria-hidden="true"
                class="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl"
              />
              <div
                aria-hidden="true"
                class="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
              />
              <div class="container-x py-14 md:py-16 relative z-10">
                <div class="grid gap-10 lg:grid-cols-2 items-center">
                  <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-[#9db8e6]">
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
                            <div class="text-2xl md:text-3xl font-extrabold text-[#9db8e6]">
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
