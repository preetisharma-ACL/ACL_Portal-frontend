import { A, createAsync, type RouteDefinition } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import HeroSearch from "~/components/HeroSearch";
import StreamIcon from "~/components/StreamIcon";
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
      <section
        class="relative bg-primary-900 text-white bg-cover bg-center"
        style={{ "background-image": "url('/bg-image.jpg')" }}
      >
        {/* Minimal overlay: keeps the copy readable, left-weighted so the image
            still shows through on the right. */}
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-gradient-to-r from-primary-900/85 via-primary-900/65 to-primary-900/40"
        />
        <div class="container-x py-14 md:py-20 relative z-10">
          <div class="max-w-3xl">
            <h1 class="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Find the right college, course and exam
            </h1>
            <p class="mt-4 text-lg text-white/80">
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
                      class="flex items-center gap-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-[var(--radius-lg)] px-4 py-3"
                    >
                      <StreamIcon slug={s.slug} />
                      <span>
                        <span class="block font-semibold">{s.name}</span>
                        <span class="block text-xs text-white/70">{s.course_count} courses</span>
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
            {/* Browse by stream */}
            <Section bg="surface">
              <div class="flex items-end justify-between mb-6">
                <h2 class="text-2xl font-bold">Browse by stream</h2>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <For each={d().streams}>
                  {(s) => (
                    <A
                      href={`/${s.slug}`}
                      class="group flex flex-col gap-2 p-5 rounded-[var(--radius-lg)] border border-[var(--color-line)] hover:border-primary-300 hover:bg-primary-50"
                    >
                      <StreamIcon slug={s.slug} class="text-3xl" />
                      <span class="font-semibold group-hover:text-primary-700">{s.name}</span>
                      <span class="text-sm text-[var(--color-muted)]">
                        {s.course_count} courses
                      </span>
                    </A>
                  )}
                </For>
              </div>
            </Section>

            {/* Browse by popular city */}
            <Section>
              <h2 class="text-2xl font-bold mb-6">Browse by popular city</h2>
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <For each={d().cities.filter((c) => POPULAR_CITY_SLUGS.includes(c.slug))}>
                  {(city) => (
                    <A
                      href={listingPath("mba", "mba", city.slug)}
                      class="p-5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-line)] hover:border-primary-300"
                    >
                      <span class="block font-semibold">{city.name}</span>
                      <span class="block text-sm text-[var(--color-muted)]">
                        {city.college_count} colleges
                      </span>
                    </A>
                  )}
                </For>
              </div>
            </Section>

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
