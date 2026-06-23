import { A, createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import SlotImage from "~/components/SlotImage";
import { Section } from "~/components/ui";
import { LoadingBlock } from "~/components/states";
import { streamQuery } from "~/lib/queries";
import { listingPath } from "~/lib/slug";
import { breadcrumbLd } from "~/lib/jsonld";

/** Cover photos shipped in /public, cycled across the course cards. */
const COVERS = ["/bg-image.jpg", "/bg-image2.jpg", "/bg-image3.jpg"];

export default function StreamLanding(props: { slug: string }) {
  // deferStream so the stream page's title/meta/canonical and breadcrumb JSON-LD
  // are server-rendered into the head, not applied on hydrate.
  const data = createAsync(() => streamQuery(props.slug), { deferStream: true });

  return (
    <Show when={data()} fallback={<LoadingBlock label="Loading stream" />}>
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

            {/* Breadcrumb hero banner with a cover photo, like the listing page */}
            <section class="relative overflow-hidden bg-neutral-900 text-white">
              {/* Managed stream banner slot (exact backend key), falling back to
                  the bundled image. */}
              <SlotImage slot={`stream_${props.slug}_banner`} fallback="/bg-image2.jpg" />
              <div
                aria-hidden="true"
                class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/40"
              />
              <div class="container-x py-10 md:py-14 relative z-10">
                <Breadcrumbs crumbs={crumbs()} light />
                <h1 class="mt-3 text-3xl md:text-4xl font-extrabold text-white leading-tight">
                  {name()} Courses, Colleges and Exams
                </h1>
                <p class="mt-3 max-w-2xl text-white/85">
                  Discover {name()} programmes, compare colleges by city and understand the
                  entrance exams.
                </p>
                <div class="mt-5 flex flex-wrap gap-2.5">
                  <span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm">
                    <span class="font-bold">{d().stream.course_count}</span> courses
                  </span>
                  <span class="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm">
                    <span class="font-bold">{d().top_cities.length}</span> cities
                  </span>
                </div>
              </div>
            </section>

            <Section>
              <h2 class="text-2xl font-bold mb-6">{name()} courses</h2>
              <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <For each={d().courses}>
                  {(c, i) => (
                    <article class="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
                      <A href={`/${c.slug}-course`} aria-label={c.name} class="relative block h-32">
                        <img
                          src={COVERS[i() % COVERS.length]}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          class="absolute inset-0 h-full w-full object-cover"
                        />
                        <div
                          aria-hidden="true"
                          class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10"
                        />
                        <Show when={c.level}>
                          <span class="absolute right-2 top-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-bold text-primary-900 shadow-sm">
                            {c.level}
                          </span>
                        </Show>
                        <h3 class="absolute inset-x-0 bottom-0 p-3 text-sm font-bold leading-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] line-clamp-2">
                          {c.name}
                        </h3>
                      </A>
                      <div class="flex flex-1 flex-col p-3">
                        <p class="text-sm">
                          <Show
                            when={c.fee_range}
                            fallback={
                              <span class="font-medium text-[var(--color-muted)]">Fees on request</span>
                            }
                          >
                            <span class="font-bold text-primary-700">{c.fee_range}</span>{" "}
                            <span class="text-xs text-[var(--color-muted)]">Total Fees</span>
                          </Show>
                        </p>
                        <Show when={c.duration}>
                          <p class="mt-2 line-clamp-1 border-t border-[var(--color-line)] pt-2 text-[11px] text-[var(--color-muted)]">
                            {c.level} · {c.duration}
                          </p>
                        </Show>
                        <div class="mt-1 border-t border-[var(--color-line)] text-xs">
                          <A
                            href={`/${c.slug}-course`}
                            class="flex items-center justify-between py-2 font-semibold text-[var(--color-ink)] transition-colors hover:text-primary-700"
                          >
                            View course details
                            <span aria-hidden="true" class="text-[var(--color-muted)]">›</span>
                          </A>
                        </div>
                      </div>
                    </article>
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
                      class="flex items-center justify-between p-4 rounded-[var(--radius-sm)] border border-[var(--color-line)] hover:border-transparent hover:bg-primary-50"
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
