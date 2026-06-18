import { createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeCardItem from "~/components/CollegeCardItem";
import { Card, Section } from "~/components/ui";
import { NotFound } from "~/components/states";
import { examQuery } from "~/lib/queries";
import { breadcrumbLd } from "~/lib/jsonld";
import { humanize } from "~/lib/slug";

export default function ExamInfo(props: { stream: string; slug: string }) {
  const data = createAsync(() => examQuery(props.slug));
  const path = () => `/${props.stream}/${props.slug}-exam`;

  return (
    <Show when={data()} fallback={<NotFound title="Exam not found" />}>
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

            <div class="bg-primary-900 text-white">
              <div class="container-x py-10">
                <Breadcrumbs crumbs={crumbs()} />
                <h1 class="mt-4 text-3xl md:text-4xl font-extrabold text-white">
                  {e().name} Exam
                </h1>
                <p class="mt-3 max-w-2xl text-white/80">Conducted by {e().conducting_body}</p>
              </div>
            </div>

            <Section>
              <div class="grid gap-8 lg:grid-cols-3">
                <div class="lg:col-span-2 space-y-8">
                  <div>
                    <h2 class="text-2xl font-bold mb-2">Overview</h2>
                    <p class="text-[var(--color-ink)]/90">{e().overview}</p>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold mb-2">Eligibility</h2>
                    <p class="text-[var(--color-ink)]/90">{e().eligibility}</p>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold mb-2">Exam pattern</h2>
                    <p class="text-[var(--color-ink)]/90">{e().pattern}</p>
                  </div>
                  <div>
                    <h2 class="text-xl font-bold mb-3">Syllabus outline</h2>
                    <ul class="list-disc pl-5 space-y-1 text-[var(--color-ink)]/90">
                      <For each={e().syllabus}>{(s) => <li>{s}</li>}</For>
                    </ul>
                  </div>
                </div>
                <aside>
                  <Card class="p-5">
                    <h3 class="font-semibold mb-3">Important dates</h3>
                    <ul class="space-y-2 text-sm">
                      <For each={e().important_dates}>
                        {(d2) => (
                          <li class="flex justify-between gap-4">
                            <span class="text-[var(--color-muted)]">{d2.label}</span>
                            <span class="font-medium">{d2.date}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Card>
                </aside>
              </div>
            </Section>

            <Section bg="surface">
              <h2 class="text-2xl font-bold mb-6">Colleges accepting {e().name}</h2>
              <div class="grid gap-4">
                <For each={d().accepting_colleges}>
                  {(c) => <CollegeCardItem college={c} />}
                </For>
              </div>
            </Section>
          </>
        );
      }}
    </Show>
  );
}
