import { A, createAsync } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeLogo from "~/components/CollegeLogo";
import LeadForm from "~/components/LeadForm";
import LeadTrigger from "~/components/LeadTrigger";
import { Card, Section } from "~/components/ui";
import { EmptyState, NotFound } from "~/components/states";
import { courseQuery } from "~/lib/queries";
import { breadcrumbLd, courseLd } from "~/lib/jsonld";
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
        <span class="text-[var(--color-muted)]">Fees </span>
        <span class="font-semibold">{c.fee_range}</span>
      </p>
      <span class="mt-4 inline-flex items-center justify-center gap-1 rounded-[var(--radius-md)] bg-primary-600 text-white text-sm font-semibold py-2 group-hover:bg-primary-700 transition-colors">
        View details
        <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </A>
  );
}

export default function CourseInfo(props: { slug: string }) {
  const data = createAsync(() => courseQuery(props.slug));
  const path = () => `/${props.slug}-course`;
  const [active, setActive] = createSignal("overview");

  return (
    <Show when={data()} fallback={<NotFound title="Course not found" />}>
      {(d) => {
        const c = () => d().course;
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
              description={`${c().name}: ${c().description.slice(0, 140)}`}
              canonical={path()}
              jsonLd={[breadcrumbLd(crumbs()), courseLd(d(), path())]}
            />

            {/* Hero with enquiry form */}
            <section class="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-900 to-primary-700 text-white">
              <div
                aria-hidden="true"
                class="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                class="pointer-events-none absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-primary-500/25 blur-3xl"
              />
              <div
                aria-hidden="true"
                class="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
              />
              <div class="container-x py-10 md:py-14 relative z-10">
                <div class="grid gap-10 lg:grid-cols-[1fr_26rem] lg:items-center">
                  <div>
                    <Breadcrumbs crumbs={crumbs()} light />
                    <span class="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-accent-400">
                      Course guide
                    </span>
                    <h1 class="mt-3 text-3xl md:text-5xl font-extrabold text-white leading-[1.08] tracking-tight">
                      {c().name} Course
                    </h1>
                    <p class="mt-4 max-w-xl text-lg text-white/85">
                      {c().description.slice(0, 150)}…
                    </p>
                    <ul class="mt-7 grid sm:grid-cols-2 gap-x-8 gap-y-3 max-w-xl">
                      <For
                        each={[
                          `${c().level} · ${c().duration}`,
                          `Fees ${c().fee_range}`,
                          `${d().specializations.length}+ specialisations`,
                          `${d().related_exams.length}+ accepted exams`,
                        ]}
                      >
                        {(t) => (
                          <li class="flex items-center gap-2.5 text-sm text-white/90">
                            <span
                              aria-hidden="true"
                              class="grid place-items-center w-5 h-5 shrink-0 rounded-full bg-accent-500/20 text-accent-400 text-xs"
                            >
                              ✓
                            </span>
                            {t}
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>

                  <Card class="p-5 sm:p-6 text-[var(--color-ink)] shadow-2xl ring-1 ring-black/5">
                    <LeadForm
                      sourcePage={path()}
                      courseInterest={c().name}
                      heading={`Compare and get free guidance for ${c().name}`}
                    />
                  </Card>
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
                    <p class="mt-3 text-[var(--color-ink)]/90">{c().description}</p>

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
                  <section id="specialisations" class="scroll-mt-28">
                    <h2 class="text-2xl font-extrabold mb-4">Specialisations</h2>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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

                  {/* Fees & eligibility */}
                  <section id="fees" class="scroll-mt-28">
                    <h2 class="text-2xl font-extrabold mb-4">Fees and eligibility</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                      <Card class="p-5">
                        <h3 class="font-semibold">Indicative fees</h3>
                        <p class="mt-1 text-2xl font-extrabold text-primary-700">{c().fee_range}</p>
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
                    <div class="mt-4 flex flex-wrap gap-2">
                      <For each={d().specializations}>
                        {(s) => (
                          <span class="rounded-full bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1">
                            {s.name}
                          </span>
                        )}
                      </For>
                    </div>
                  </section>

                  {/* Exams */}
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
                          { k: "Fee range", v: c().fee_range },
                          { k: "Specialisations", v: `${d().specializations.length}+` },
                        ]}
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
