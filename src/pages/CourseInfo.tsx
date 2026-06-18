import { A, createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import { Badge, Card, Section } from "~/components/ui";
import CollegeCardItem from "~/components/CollegeCardItem";
import LeadForm from "~/components/LeadForm";
import { EmptyState, NotFound } from "~/components/states";
import { courseQuery } from "~/lib/queries";
import { breadcrumbLd, courseLd } from "~/lib/jsonld";

export default function CourseInfo(props: { slug: string }) {
  const data = createAsync(() => courseQuery(props.slug));
  const path = () => `/${props.slug}-course`;

  return (
    <Show when={data()} fallback={<NotFound title="Course not found" />}>
      {(d) => {
        const c = () => d().course;
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: c().name, path: path() },
        ];
        return (
          <>
            <Seo
              title={`${c().name} Course: Eligibility, Fees, Specialisations and Top Colleges`}
              description={`${c().name}: ${c().description.slice(0, 140)}`}
              canonical={path()}
              jsonLd={[breadcrumbLd(crumbs()), courseLd(d(), path())]}
            />

            <div class="bg-primary-900 text-white">
              <div class="container-x py-10">
                <Breadcrumbs crumbs={crumbs()} />
                <h1 class="mt-4 text-3xl md:text-4xl font-extrabold text-white">
                  {c().name} Course
                </h1>
                <p class="mt-3 max-w-2xl text-white/80">
                  {c().level} · {c().duration} · Fees {c().fee_range}
                </p>
              </div>
            </div>

            <Section>
              <div class="grid gap-8 lg:grid-cols-3">
                <div class="lg:col-span-2 space-y-8">
                  <div>
                    <h2 class="text-2xl font-bold mb-3">What is {c().name}?</h2>
                    <p class="text-[var(--color-ink)]/90">{c().description}</p>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold mb-2">Eligibility</h2>
                    <p class="text-[var(--color-ink)]/90">{c().eligibility}</p>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold mb-2">Career scope</h2>
                    <p class="text-[var(--color-ink)]/90">{c().career_scope}</p>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold mb-3">Specialisations</h2>
                    <div class="flex flex-wrap gap-2">
                      <For each={d().specializations}>
                        {(s) => <Badge tone="primary">{s.name}</Badge>}
                      </For>
                    </div>
                  </div>
                </div>

                <aside class="space-y-6">
                  <Card class="p-5">
                    <h3 class="font-semibold mb-3">Related exams</h3>
                    <ul class="space-y-2 text-sm">
                      <For each={d().related_exams}>
                        {(e) => (
                          <li class="flex justify-between">
                            <A
                              href={`/mba/${e.slug}-exam`}
                              class="text-primary-700 hover:underline"
                            >
                              {e.name}
                            </A>
                            <span class="text-[var(--color-muted)]">{e.conducting_body}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Card>
                  <Card class="p-5 bg-primary-50 border-primary-100">
                    <LeadForm
                      sourcePage={path()}
                      courseInterest={c().name}
                      heading={`Get free guidance on ${c().name} admissions`}
                    />
                  </Card>
                </aside>
              </div>
            </Section>

            <Section bg="surface">
              <h2 class="text-2xl font-bold mb-6">Top colleges offering {c().name}</h2>
              <Show
                when={d().top_colleges.length}
                fallback={
                  <EmptyState title="Colleges are being added">
                    We are still compiling colleges that offer this course. Meanwhile, explore
                    colleges by city from the stream pages.
                  </EmptyState>
                }
              >
                <div class="grid gap-4">
                  <For each={d().top_colleges}>{(col) => <CollegeCardItem college={col} />}</For>
                </div>
              </Show>
            </Section>
          </>
        );
      }}
    </Show>
  );
}
