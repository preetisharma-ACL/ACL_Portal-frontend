import { A, createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import { Card, LinkButton, Section } from "~/components/ui";
import { NotFound } from "~/components/states";
import { streamQuery } from "~/lib/queries";
import { listingPath } from "~/lib/slug";
import { breadcrumbLd } from "~/lib/jsonld";

export default function StreamLanding(props: { slug: string }) {
  const data = createAsync(() => streamQuery(props.slug));

  return (
    <Show when={data()} fallback={<NotFound title="Stream not found" />}>
      {(d) => {
        const name = () => d().stream.name;
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: name(), path: `/${props.slug}` },
        ];
        return (
          <>
            <Seo
              title={`${name()} Colleges, Courses and Exams`}
              description={`Explore ${name()} courses, top colleges by city and the entrance exams that matter. Compare fees, approvals and placements on ${name()} programmes.`}
              canonical={`/${props.slug}`}
              jsonLd={breadcrumbLd(crumbs())}
            />

            <div class="bg-primary-900 text-white">
              <div class="container-x py-10">
                <Breadcrumbs crumbs={crumbs()} />
                <h1 class="mt-4 text-3xl md:text-4xl font-extrabold text-white">
                  {name()} Courses, Colleges and Exams
                </h1>
                <p class="mt-3 max-w-2xl text-white/80">
                  Discover {name()} programmes, compare colleges by city and understand the
                  entrance exams. {d().stream.course_count} courses tracked.
                </p>
              </div>
            </div>

            <Section>
              <h2 class="text-2xl font-bold mb-6">{name()} courses</h2>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <For each={d().courses}>
                  {(c) => (
                    <Card class="p-5">
                      <h3 class="font-semibold text-lg">{c.name}</h3>
                      <Show when={c.duration}>
                        <p class="mt-1 text-sm text-[var(--color-muted)]">
                          {c.level} · {c.duration}
                        </p>
                      </Show>
                      <Show when={c.fee_range}>
                        <p class="mt-2 text-sm">Fees: {c.fee_range}</p>
                      </Show>
                      <div class="mt-4">
                        <LinkButton href={`/${c.slug}-course`} variant="outline" size="sm">
                          Course details
                        </LinkButton>
                      </div>
                    </Card>
                  )}
                </For>
              </div>
            </Section>

            <Section bg="surface">
              <h2 class="text-2xl font-bold mb-6">{name()} colleges by city</h2>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <For each={d().top_cities}>
                  {(city) => (
                    <A
                      href={listingPath(props.slug, props.slug, city.slug)}
                      class="flex items-center justify-between p-4 rounded-[var(--radius-md)] border border-[var(--color-line)] hover:border-primary-300 hover:bg-primary-50"
                    >
                      <span>
                        <span class="font-medium">
                          {name()} colleges in {city.name}
                        </span>
                        <span class="block text-sm text-[var(--color-muted)]">
                          {city.college_count} colleges · {city.state}
                        </span>
                      </span>
                      <span aria-hidden="true" class="text-primary-600">
                        →
                      </span>
                    </A>
                  )}
                </For>
              </div>
            </Section>
          </>
        );
      }}
    </Show>
  );
}
