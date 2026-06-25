import { A, createAsync } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeLogo from "~/components/CollegeLogo";
import LeadForm from "~/components/LeadForm";
import LeadTrigger from "~/components/LeadTrigger";
import { Card, Section } from "~/components/ui";
import { EmptyState, LoadingBlock } from "~/components/states";
import { courseQuery } from "~/lib/queries";
import { breadcrumbLd, courseLd } from "~/lib/jsonld";
import { formatFeeRange } from "~/lib/format";
import RelatedArticles from "~/components/RelatedArticles";
import type { CollegeCard } from "~/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "highlights", label: "Highlights" },
  { id: "specialisations", label: "Specialisations" },
  { id: "fees", label: "Fees & Eligibility" },
  { id: "career", label: "Career" },
  { id: "exams", label: "Exams" },
  { id: "colleges", label: "Top Colleges" },
];

const HERO_LOGOS = [
  "/gla-university-online-logo.webp",
  "/lpu.png",
  "/sharda.png",
  "/sms.webp",
];

const HERO_FEATURES = [
  "100+ colleges to compare",
  "30+ comparison factors",
  "Free expert guidance",
  "Verified, comparable information",
  "Compare fees and placements",
  "Admission guidance support",
  "Independent and unbiased",
  "Courses, colleges and exams in one place",
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

const BENEFITS = [
  {
    title: "Specialised expertise",
    text: "Build deep, job-ready skills in your chosen area of focus.",
    p: '<path d="M12 2 9.2 8.6 2 9.2l5.5 4.7L5.8 21 12 17l6.2 4-1.7-7.1L22 9.2l-7.2-.6Z"/>',
  },
  {
    title: "Career growth",
    text: "Open up roles across sectors and move towards leadership.",
    p: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  },
  {
    title: "Industry network",
    text: "Learn alongside peers, mentors and visiting recruiters.",
    p: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
  {
    title: "Flexible pathways",
    text: "Full time, part time and online options to fit your life.",
    p: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  },
];

/** Vertical program card (top colleges offering this course). */
function ProgramCard(props: { college: CollegeCard; featured?: boolean }) {
  const c = props.college;
  const href = `/college/${c.slug}-${c.id}`;
  return (
    <A
      href={href}
      class="group relative flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition-all hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <Show when={props.featured}>
        <span class="absolute right-4 top-4 rounded-full bg-accent-400/15 text-accent-600 text-[10px] font-bold px-2 py-0.5">
          Top rated
        </span>
      </Show>
      <div class="h-12 flex items-center">
        <CollegeLogo name={c.name} logo={c.logo} id={c.id} class="max-h-12 w-auto max-w-[7rem] text-lg" />
      </div>
      <h3 class="mt-3 font-semibold leading-snug line-clamp-2 group-hover:text-primary-700">
        {c.name}
      </h3>
      <div class="mt-2 flex items-center gap-1.5 text-sm">
        <span aria-hidden="true" class="text-[var(--color-warning)]">★</span>
        <span class="font-semibold">{c.rating.toFixed(1)}</span>
        <span class="text-[var(--color-muted)]">· {c.city}</span>
      </div>
      <div class="mt-1 flex flex-wrap gap-1.5">
        <For each={c.approvals.slice(0, 3)}>
          {(a) => (
            <span class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
              {a}
            </span>
          )}
        </For>
      </div>
      <p class="mt-3 text-sm">
        <Show
          when={c.fee_range}
          fallback={<span class="font-semibold text-[var(--color-muted)]">Fees on request</span>}
        >
          <span class="text-[var(--color-muted)]">Fees </span>
          <span class="font-semibold">{c.fee_range}</span>
        </Show>
      </p>
      <span class="mt-4 inline-flex items-center justify-center gap-1 rounded-[var(--radius-md)] bg-primary-600 text-white text-sm font-semibold py-2 group-hover:bg-primary-700 transition-colors">
        View details
        <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </A>
  );
}

export default function CourseInfo(props: { slug: string }) {
  // deferStream so the course's title/meta/canonical/OG and Course JSON-LD are
  // server-rendered into the head, not applied on hydrate.
  const data = createAsync(() => courseQuery(props.slug), { deferStream: true });
  const path = () => `/${props.slug}-course`;
  const [active, setActive] = createSignal("overview");

  return (
    <Show when={data()} fallback={<LoadingBlock label="Loading course" />}>
      {(d) => {
        const c = () => d().course;
        // fee_range is the native {min,max}; format for display, falling back to
        // the "Fees on request" state when null (never [object Object]/blank/0).
        const fee = () => formatFeeRange(c().fee_range) || "Fees on request";
        const overview = () => c().overview || c().description;
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: c().name, path: path() },
        ];
        const highlights = () => [
          `${c().duration} ${c().level.toLowerCase()} programme`,
          `Specialise in ${d().specializations[0]?.name ?? "multiple areas"} and more`,
          "Recognised by leading institutes and recruiters",
          "Strong placement and internship opportunities",
          "Curriculum blends theory with live projects",
          "Pathways for both freshers and working professionals",
        ];

        return (
          <>
            <Seo
              title={`${c().name} Course: Eligibility, Fees, Specialisations and Top Colleges`}
              description={`${c().name}: ${overview().slice(0, 140)}`}
              canonical={path()}
              jsonLd={[breadcrumbLd(crumbs()), courseLd(d(), path())]}
            />

            {/* Hero: comparison panel + enquiry form */}
            <section class="bg-[var(--color-canvas)] border-b border-[var(--color-line)]">
              <div class="container-x py-8 md:py-10">
                <Breadcrumbs crumbs={crumbs()} />
                <h1 class="mt-3 text-2xl md:text-3xl font-extrabold leading-tight">
                  {c().name} Course
                </h1>
                <p class="mt-2 max-w-3xl text-[var(--color-muted)]">
                  {overview().slice(0, 150)}…
                </p>

                <div class="mt-6 grid gap-6 lg:grid-cols-2 items-start">
                  {/* Left: platform comparison panel */}
                  <div class="min-w-0 rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
                    {/* Infinite scrolling logo strip */}
                    <div class="relative overflow-hidden">
                      <div class="marquee-track flex w-max gap-3">
                        <For each={[...HERO_LOGOS, ...HERO_LOGOS, ...HERO_LOGOS, ...HERO_LOGOS]}>
                          {(src) => (
                            <div class="grid place-items-center h-14 w-28 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-2">
                              <img
                                src={src}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                class="max-h-9 max-w-full object-contain"
                              />
                            </div>
                          )}
                        </For>
                      </div>
                      <div
                        aria-hidden="true"
                        class="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--color-surface)] to-transparent"
                      />
                      <div
                        aria-hidden="true"
                        class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--color-surface)] to-transparent"
                      />
                    </div>
                    <div class="mt-4 rounded-[var(--radius-md)] bg-primary-50 px-4 py-3">
                      <p class="font-bold text-primary-900">
                        India's colleges on a single platform, in minutes
                      </p>
                    </div>
                    <ul class="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      <For each={HERO_FEATURES}>
                        {(f) => (
                          <li class="flex items-center gap-2 text-sm">
                            <span aria-hidden="true" class="text-accent-500">★</span>
                            {f}
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>

                  {/* Right: enquiry form */}
                  <div class="min-w-0 rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-lg p-5 sm:p-6">
                    <h2 class="text-xl sm:text-2xl font-extrabold leading-snug">
                      <span class="text-primary-700">Compare and shortlist</span> from 100+{" "}
                      {c().name} colleges
                    </h2>
                    <div class="mt-4 grid grid-cols-2 gap-3">
                      <div class="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-2">
                        <Icon
                          d='<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'
                          class="w-5 h-5 text-primary-600 shrink-0"
                        />
                        <span class="text-xs font-semibold">Free expert guidance</span>
                      </div>
                      <div class="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-2">
                        <Icon
                          d='<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>'
                          class="w-5 h-5 text-primary-600 shrink-0"
                        />
                        <span class="text-xs font-semibold">Independent and unbiased</span>
                      </div>
                    </div>
                    <div class="mt-4">
                      <LeadForm
                        sourcePage={path()}
                        courseInterest={c().name}
                        courseSlug={props.slug}
                        hideHeading
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Sticky section tabs */}
            <nav
              aria-label="Sections"
              class="sticky top-16 z-30 bg-[var(--color-surface)] border-b border-[var(--color-line)] overflow-x-auto"
            >
              <div class="container-x flex gap-1">
                <For each={TABS}>
                  {(t) => (
                    <a
                      href={`#${t.id}`}
                      onClick={() => setActive(t.id)}
                      aria-current={active() === t.id ? "location" : undefined}
                      class="whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 transition-colors"
                      classList={{
                        "border-primary-600 text-primary-700": active() === t.id,
                        "border-transparent hover:text-primary-700": active() !== t.id,
                      }}
                    >
                      {t.label}
                    </a>
                  )}
                </For>
              </div>
            </nav>

            <Section>
              <div class="grid gap-8 lg:grid-cols-3">
                <div class="lg:col-span-2 space-y-10">
                  {/* Overview */}
                  <section id="overview" class="scroll-mt-28">
                    <h2 class="text-2xl font-extrabold">{c().name} program overview</h2>
                    <p class="mt-3 text-[var(--color-ink)]/90">{overview()}</p>

                    <div class="mt-6 grid gap-4 sm:grid-cols-2">
                      <For each={BENEFITS}>
                        {(b) => (
                          <div class="flex gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                            <span class="grid place-items-center w-10 h-10 shrink-0 rounded-[var(--radius-md)] bg-primary-50 text-primary-700">
                              <Icon d={b.p} />
                            </span>
                            <div>
                              <h3 class="font-semibold">{b.title}</h3>
                              <p class="mt-0.5 text-sm text-[var(--color-muted)]">{b.text}</p>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>

                    <h3 class="mt-8 text-lg font-bold">Why pursue {c().name}?</h3>
                    <p class="mt-2 text-[var(--color-ink)]/90 text-sm">
                      A {c().name} helps you build focused expertise and a professional network
                      that employers value. {c().career_scope}
                    </p>
                    <h3 class="mt-5 text-lg font-bold">Who should consider it?</h3>
                    <p class="mt-2 text-[var(--color-ink)]/90 text-sm">
                      {c().eligibility} It suits both recent graduates looking to specialise and
                      working professionals aiming to advance their careers.
                    </p>
                  </section>

                  {/* Highlights */}
                  <section id="highlights" class="scroll-mt-28">
                    <h2 class="text-2xl font-extrabold mb-4">Key highlights</h2>
                    <ul class="grid sm:grid-cols-2 gap-3">
                      <For each={highlights()}>
                        {(h) => (
                          <li class="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-sm">
                            <span aria-hidden="true" class="mt-0.5 text-[var(--color-success)]">✓</span>
                            <span>{h}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </section>

                  {/* Specialisations */}
                  <Show when={d().specializations.length}>
                  <section id="specialisations" class="scroll-mt-28">
                    <h2 class="text-2xl font-extrabold mb-4">Specialisations</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <For each={d().specializations}>
                        {(s) => (
                          <span class="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium">
                            <span aria-hidden="true" class="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" />
                            <span class="truncate">{s.name}</span>
                          </span>
                        )}
                      </For>
                    </div>
                  </section>
                  </Show>

                  {/* Fees & eligibility */}
                  <section id="fees" class="scroll-mt-28">
                    <h2 class="text-2xl font-extrabold mb-4">Fees and eligibility</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                      <Card class="p-5">
                        <h3 class="font-semibold">Indicative fees</h3>
                        <p class="mt-1 text-2xl font-extrabold text-primary-700">{fee()}</p>
                        <p class="mt-2 text-xs text-[var(--color-muted)]">
                          Fees vary by institute and are indicative. Confirm with the college.
                        </p>
                      </Card>
                      <Card class="p-5">
                        <h3 class="font-semibold">Eligibility</h3>
                        <p class="mt-1 text-sm text-[var(--color-ink)]/90">{c().eligibility}</p>
                      </Card>
                    </div>
                  </section>

                  {/* Career */}
                  <section id="career" class="scroll-mt-28">
                    <h2 class="text-2xl font-extrabold mb-3">Career scope</h2>
                    <p class="text-[var(--color-ink)]/90 text-sm">{c().career_scope}</p>

                    <Show when={c().average_salary}>
                      <p class="mt-4 text-sm">
                        <span class="text-[var(--color-muted)]">Indicative average salary </span>
                        <span class="font-semibold">{c().average_salary}</span>
                      </p>
                    </Show>

                    <Show when={(c().job_roles ?? []).length}>
                      <h3 class="mt-5 text-lg font-bold">Common roles</h3>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <For each={c().job_roles ?? []}>
                          {(r) => (
                            <span class="rounded-full bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1">
                              {r}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>

                    <Show when={(c().top_recruiters ?? []).length}>
                      <h3 class="mt-5 text-lg font-bold">Top recruiters</h3>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <For each={c().top_recruiters ?? []}>
                          {(r) => (
                            <span class="rounded-full border border-[var(--color-line)] text-xs font-medium px-3 py-1">
                              {r}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                  </section>

                  {/* Exams */}
                  <Show when={d().related_exams.length}>
                  <section id="exams" class="scroll-mt-28">
                    <h2 class="text-2xl font-extrabold mb-4">Accepted entrance exams</h2>
                    <div class="grid gap-3 sm:grid-cols-2">
                      <For each={d().related_exams}>
                        {(e) => (
                          <A
                            href={`/mba/${e.slug}-exam`}
                            class="group flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 hover:border-primary-300 hover:shadow-sm transition-all"
                          >
                            <span class="min-w-0">
                              <span class="block font-semibold group-hover:text-primary-700">
                                {e.name}
                              </span>
                              <span class="block text-xs text-[var(--color-muted)] truncate">
                                {e.conducting_body}
                              </span>
                            </span>
                            <span aria-hidden="true" class="text-primary-400 transition-transform group-hover:translate-x-0.5">
                              →
                            </span>
                          </A>
                        )}
                      </For>
                    </div>
                  </section>
                  </Show>
                </div>

                {/* Sticky aside */}
                <aside class="space-y-6 lg:sticky lg:top-32 lg:self-start">
                  <Card class="p-5">
                    <h3 class="font-semibold mb-3">Quick facts</h3>
                    <dl class="divide-y divide-[var(--color-line)] text-sm">
                      <For
                        each={[
                          { k: "Level", v: c().level },
                          { k: "Duration", v: c().duration },
                          { k: "Fee range", v: fee() },
                          { k: "Average salary", v: c().average_salary ?? "" },
                          { k: "Specialisations", v: `${d().specializations.length}+` },
                        ].filter((row) => row.v)}
                      >
                        {(row) => (
                          <div class="flex items-center justify-between gap-4 py-2.5">
                            <dt class="text-[var(--color-muted)]">{row.k}</dt>
                            <dd class="font-medium text-right">{row.v}</dd>
                          </div>
                        )}
                      </For>
                    </dl>
                  </Card>
                  <Card class="p-5 bg-primary-50 border-primary-100">
                    <h3 class="font-bold">Need help deciding?</h3>
                    <p class="mt-1 text-sm text-[var(--color-muted)]">
                      Get free, no obligation guidance on the best colleges for {c().name}.
                    </p>
                    <div class="mt-4">
                      <LeadTrigger
                        sourcePage={path()}
                        courseInterest={c().name}
                        courseSlug={props.slug}
                        label="Get free guidance"
                        class="w-full"
                      />
                    </div>
                  </Card>
                </aside>
              </div>
            </Section>

            {/* Top colleges */}
            <Section bg="surface">
              <div id="colleges" class="scroll-mt-28 mb-6 max-w-2xl">
                <span class="text-xs font-semibold uppercase tracking-wider text-accent-600">
                  Where to study
                </span>
                <h2 class="mt-2 text-2xl font-extrabold">Top colleges offering {c().name}</h2>
              </div>
              <Show
                when={d().top_colleges.length}
                fallback={
                  <EmptyState title="Colleges are being added">
                    We are still compiling colleges that offer this course. Meanwhile, explore
                    colleges by city from the stream pages.
                  </EmptyState>
                }
              >
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <For each={d().top_colleges}>
                    {(col, i) => <ProgramCard college={col} featured={i() === 0} />}
                  </For>
                </div>
              </Show>
            </Section>

            <div class="container-x pb-2">
              <RelatedArticles course={props.slug} />
            </div>

            {/* CTA band */}
            <section class="relative overflow-hidden bg-gradient-to-br from-primary-900 to-primary-700 text-white">
              <div
                aria-hidden="true"
                class="pointer-events-none absolute -top-20 right-1/4 w-80 h-80 rounded-full bg-accent-500/20 blur-3xl"
              />
              <div class="container-x py-12 relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 class="text-2xl font-extrabold text-white">
                    Get a free {c().name} guidance call
                  </h2>
                  <p class="mt-2 text-white/80 max-w-xl">
                    Compare colleges, fees and admissions with an advisor. Free for students.
                  </p>
                </div>
                <LeadTrigger
                  sourcePage={path()}
                  courseInterest={c().name}
                  courseSlug={props.slug}
                  label="Get free guidance"
                  size="lg"
                />
              </div>
            </section>
          </>
        );
      }}
    </Show>
  );
}
