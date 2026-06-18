import { createAsync } from "@solidjs/router";
import { For, Show } from "solid-js";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import { Badge, Section } from "~/components/ui";
import { NotFound } from "~/components/states";
import { collegeQuery } from "~/lib/queries";
import { parseSlugId } from "~/lib/slug";
import { breadcrumbLd, collegeLd } from "~/lib/jsonld";

export type CollegeTab = "overview" | "courses-fees" | "placements" | "admission" | "reviews";

const TAB_TITLE: Record<CollegeTab, string> = {
  overview: "",
  "courses-fees": "Courses and Fees",
  placements: "Placements",
  admission: "Admission",
  reviews: "Reviews",
};

export default function CollegeDetail(props: { slugId: string; tab?: CollegeTab }) {
  const parsed = () => parseSlugId(props.slugId);
  const data = createAsync(() => collegeQuery(parsed().slug, parsed().id));

  return (
    <Show when={data()} fallback={<NotFound title="College not found" />}>
      {(d) => {
        const h = () => d().header;
        const basePath = () => `/college/${props.slugId}`;
        const path = () =>
          props.tab && props.tab !== "overview"
            ? `${basePath()}/${props.tab}`
            : basePath();
        const titleSuffix = () =>
          props.tab && TAB_TITLE[props.tab] ? `: ${TAB_TITLE[props.tab]}` : "";
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: h().city, path: `/mba/colleges/mba-colleges-${h().city.toLowerCase().replace(/\s+/g, "-")}` },
          { name: h().name, path: basePath() },
        ];
        return (
          <>
            <Seo
              title={`${h().name}${titleSuffix()}: Courses, Fees, Admission and Placements`}
              description={`${h().name}, ${h().city}. ${h().type} institute established ${h().established}. Courses, fees, admission, placements and rankings.`}
              canonical={path()}
              jsonLd={[breadcrumbLd(crumbs()), collegeLd(d(), basePath())]}
            />

            <div class="bg-primary-900 text-white">
              <div class="container-x py-8">
                <Breadcrumbs crumbs={crumbs()} />
                <div class="mt-4 flex items-center gap-4">
                  <img
                    src={h().logo}
                    alt={`${h().name} logo`}
                    width="72"
                    height="72"
                    class="w-18 h-18 rounded-[var(--radius-md)] bg-white p-1"
                  />
                  <div>
                    <h1 class="text-2xl md:text-3xl font-extrabold text-white">{h().name}</h1>
                    <p class="text-white/80">
                      {h().city}, {h().state} · {h().type} · Established {h().established}
                    </p>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      <For each={h().approvals}>{(a) => <Badge tone="primary">{a}</Badge>}</For>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Section>
              <h2 class="text-xl font-bold mb-2">Overview</h2>
              <p class="text-[var(--color-ink)]/90 max-w-3xl">{d().overview.description}</p>
              <p class="mt-6 text-xs text-[var(--color-muted)]">{d().operator_disclosure}</p>
            </Section>
          </>
        );
      }}
    </Show>
  );
}
