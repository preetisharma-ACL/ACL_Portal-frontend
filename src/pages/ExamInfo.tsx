import { A, createAsync } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeCardItem from "~/components/CollegeCardItem";
import LeadForm from "~/components/LeadForm";
import LeadTrigger from "~/components/LeadTrigger";
import { Card, Section } from "~/components/ui";
import { EmptyState, LoadingBlock } from "~/components/states";
import { examQuery } from "~/lib/queries";
import { breadcrumbLd } from "~/lib/jsonld";
import { humanize } from "~/lib/slug";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "eligibility", label: "Eligibility" },
  { id: "pattern", label: "Exam pattern" },
  { id: "syllabus", label: "Syllabus" },
  { id: "dates", label: "Important dates" },
  { id: "colleges", label: "Accepting colleges" },
];

export default function ExamInfo(props: { stream: string; slug: string }) {
  const data = createAsync(() => examQuery(props.slug));
  const path = () => `/${props.stream}/${props.slug}-exam`;
  const [active, setActive] = createSignal("overview");

  return (
    <Show when={data()} fallback={<LoadingBlock label="Loading exam" />}>
      {(d) => {
        const e = () => d().exam;
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: humanize(props.stream), path: `/${props.stream}` },
          { name: `${e().name} exam`, path: path() },
        ];

        return (
          <>
            <Seo
              title={`${e().name} Exam: Eligibility, Pattern, Dates and Syllabus`}
              description={`${e().name} by ${e().conducting_body}. ${e().overview.slice(0, 130)}`}
              canonical={path()}
              jsonLd={breadcrumbLd(crumbs())}
            />

            {/* Header */}
            <section class="relative overflow-hidden bg-primary-900 text-white">
              <div
                aria-hidden="true"
                class="pointer-events-none absolute -top-24 right-0 w-96 h-96 rounded-full bg-accent-500/15 blur-3xl"
              />
              <div class="container-x py-10 md:py-14 relative z-10">
                <Breadcrumbs crumbs={crumbs()} light />
                <div class="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div class="max-w-2xl">
                    <span class="text-xs font-semibold uppercase tracking-wider text-accent-400">
                      Entrance exam
                    </span>
                    <h1 class="mt-2 text-3xl md:text-4xl font-extrabold text-white leading-tight">
                      {e().name} Exam
                    </h1>
                    <p class="mt-2 text-white/80">Conducted by {e().conducting_body}</p>
                    <div class="mt-5 flex flex-wrap gap-2.5">
                      <For
                        each={[
                          { k: "Sections", v: String(e().syllabus.length) },
                          { k: "Key dates", v: String(e().important_dates.length) },
                          { k: "Colleges accept", v: `${d().accepting_colleges.length}+` },
                        ]}
                      >
                        {(chip) => (
                          <span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm">
                            <span class="text-white/60">{chip.k}</span>
                            <span class="font-semibold">{chip.v}</span>
                          </span>
                        )}
                      </For>
                    </div>
                  </div>
                  <div class="shrink-0">
                    <LeadTrigger
                      sourcePage={path()}
                      courseInterest={e().name}
                      heading={`Get free guidance for ${e().name}`}
                      label="Get exam guidance"
                      variant="accent"
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Sticky section nav */}
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
                {/* Main column */}
                <div class="lg:col-span-2 space-y-6">
                  <Card id="overview" class="scroll-mt-28 p-5 sm:p-6 shadow-sm">
                    <h2 class="text-xl font-bold">{e().name} overview</h2>
                    <p class="mt-3 text-[var(--color-ink)]/90">{e().overview}</p>
                  </Card>

                  <Card id="eligibility" class="scroll-mt-28 p-5 sm:p-6 shadow-sm">
                    <h2 class="text-xl font-bold">Eligibility</h2>
                    <p class="mt-3 text-[var(--color-ink)]/90">{e().eligibility}</p>
                  </Card>

                  <Card id="pattern" class="scroll-mt-28 p-5 sm:p-6 shadow-sm">
                    <h2 class="text-xl font-bold">Exam pattern</h2>
                    <p class="mt-3 text-[var(--color-ink)]/90">{e().pattern}</p>
                  </Card>

                  <Card id="syllabus" class="scroll-mt-28 p-5 sm:p-6 shadow-sm">
                    <h2 class="text-xl font-bold mb-4">Syllabus outline</h2>
                    <div class="grid gap-3 sm:grid-cols-2">
                      <For each={e().syllabus}>
                        {(s, i) => (
                          <div class="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
                            <span class="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-primary-600 text-white text-xs font-bold">
                              {i() + 1}
                            </span>
                            <span class="text-sm font-medium">{s}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </Card>

                  <Card id="dates" class="scroll-mt-28 p-5 sm:p-6 shadow-sm">
                    <h2 class="text-xl font-bold mb-5">Important dates</h2>
                    <ol class="relative ml-1.5 border-l-2 border-[var(--color-line)] space-y-5">
                      <For each={e().important_dates}>
                        {(dt) => (
                          <li class="relative pl-5">
                            <span
                              aria-hidden="true"
                              class="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-accent-500 ring-4 ring-[var(--color-surface)]"
                            />
                            <p class="text-sm font-bold">{dt.date}</p>
                            <p class="text-sm text-[var(--color-muted)]">{dt.label}</p>
                          </li>
                        )}
                      </For>
                    </ol>
                  </Card>
                </div>

                {/* Sticky sidebar */}
                <aside class="space-y-6 lg:sticky lg:top-32 lg:self-start">
                  <Card class="p-5 shadow-sm">
                    <h3 class="font-semibold mb-3">Quick facts</h3>
                    <dl class="divide-y divide-[var(--color-line)] text-sm">
                      <For
                        each={[
                          { k: "Conducting body", v: e().conducting_body },
                          { k: "Sections", v: String(e().syllabus.length) },
                          { k: "Colleges accepting", v: `${d().accepting_colleges.length}+` },
                        ]}
                      >
                        {(row) => (
                          <div class="flex items-start justify-between gap-4 py-2.5">
                            <dt class="text-[var(--color-muted)]">{row.k}</dt>
                            <dd class="font-medium text-right">{row.v}</dd>
                          </div>
                        )}
                      </For>
                    </dl>
                  </Card>

                  <Card class="p-5 bg-primary-50 border-primary-100 shadow-sm">
                    <LeadForm
                      sourcePage={path()}
                      courseInterest={e().name}
                      heading={`Get guidance for ${e().name} and accepting colleges`}
                    />
                  </Card>
                </aside>
              </div>
            </Section>

            {/* Accepting colleges */}
            <Section bg="surface">
              <div id="colleges" class="scroll-mt-28 mb-6 max-w-2xl">
                <span class="text-xs font-semibold uppercase tracking-wider text-accent-600">
                  Where it is accepted
                </span>
                <h2 class="mt-2 text-2xl font-extrabold">Colleges accepting {e().name}</h2>
              </div>
              <Show
                when={d().accepting_colleges.length}
                fallback={
                  <EmptyState title="Colleges are being added">
                    We are still compiling colleges that accept this exam. Check back soon or
                    browse colleges by city.
                  </EmptyState>
                }
              >
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <For each={d().accepting_colleges}>
                    {(c) => <CollegeCardItem college={c} />}
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
                    Preparing for {e().name}?
                  </h2>
                  <p class="mt-2 text-white/80 max-w-xl">
                    Get free guidance on colleges that accept {e().name} and how to apply. Free
                    for students.
                  </p>
                </div>
                <LeadTrigger
                  sourcePage={path()}
                  courseInterest={e().name}
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
