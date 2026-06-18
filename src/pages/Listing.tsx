import { createAsync, useParams, useSearchParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import CollegeCardItem from "~/components/CollegeCardItem";
import { Section } from "~/components/ui";
import { NotFound } from "~/components/states";
import { listingQuery } from "~/lib/queries";
import { parseListingSlug } from "~/lib/slug";
import { breadcrumbLd } from "~/lib/jsonld";
import type { ListingQuery } from "~/lib/types";

export default function Listing() {
  const params = useParams();
  const [sp] = useSearchParams();
  const parsed = () => parseListingSlug(params.listing);

  const q = (): ListingQuery => ({
    course: parsed().course || params.stream,
    city: parsed().city,
    type: (sp.type as string) || undefined,
    exam: (sp.exam as string) || undefined,
    approval: (sp.approval as string) || undefined,
    fees_min: (sp.fees_min as string) || undefined,
    fees_max: (sp.fees_max as string) || undefined,
    sort: (sp.sort as string) || undefined,
    page: (sp.page as string) || undefined,
  });

  const data = createAsync(() => listingQuery(q()));

  return (
    <Show when={data()} fallback={<NotFound title="Listing not found" />}>
      {(d) => {
        const m = () => d().meta;
        const path = () => `/${params.stream}/colleges/${params.listing}`;
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: m().course, path: `/${params.stream}` },
          { name: `${m().course} colleges in ${m().city}`, path: path() },
        ];
        return (
          <>
            <Seo
              title={`${m().course} Colleges in ${m().city}: Fees, Admission and Ranking`}
              description={`List of ${m().total_colleges} ${m().course} colleges in ${m().city}. Compare fees (${m().fee_range}), approvals, accepted exams and ratings.`}
              canonical={path()}
              jsonLd={breadcrumbLd(crumbs())}
            />
            <div class="container-x py-6">
              <Breadcrumbs crumbs={crumbs()} />
              <h1 class="mt-3 text-2xl md:text-3xl font-extrabold">
                {m().course} Colleges in {m().city}
              </h1>
              <Show when={m().intro}>
                <p class="mt-2 max-w-3xl text-[var(--color-muted)]">{m().intro}</p>
              </Show>
            </div>
            <Section>
              <p class="text-sm text-[var(--color-muted)] mb-4">
                {d().results.length} colleges
              </p>
              <div class="grid gap-4">
                <For each={d().results}>{(c) => <CollegeCardItem college={c} />}</For>
              </div>
            </Section>
          </>
        );
      }}
    </Show>
  );
}
