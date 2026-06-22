import { createAsync } from "@solidjs/router";
import { For, Show, createSignal, onMount, type JSX } from "solid-js";
import { isServer } from "solid-js/web";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import LeadForm from "~/components/LeadForm";
import LeadTrigger from "~/components/LeadTrigger";
import HeroSlider from "~/components/HeroSlider";
import CollegeLogo from "~/components/CollegeLogo";
import { Badge, Card, LinkButton } from "~/components/ui";
import { LoadingBlock } from "~/components/states";
import { collegeQuery } from "~/lib/queries";
import { listingPath, parseSlugId } from "~/lib/slug";
import { breadcrumbLd, collegeLd, collegeCoursesLd } from "~/lib/jsonld";

export type CollegeTab = "overview" | "courses-fees" | "placements" | "admission" | "reviews";

const TAB_TITLE: Record<CollegeTab, string> = {
  overview: "",
  "courses-fees": "Courses and Fees",
  placements: "Placements",
  admission: "Admission",
  reviews: "Reviews",
};

/** In-page sections, in order. Three of them double as crawlable sub-routes. */
const SECTIONS: { id: string; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "courses-fees", label: "Courses & Fees" },
  { id: "admissions", label: "Admissions" },
  { id: "placements", label: "Placements" },
  { id: "rankings", label: "Rankings" },
  { id: "cutoffs", label: "Cutoffs" },
  { id: "gallery", label: "Gallery" },
  { id: "reviews", label: "Reviews" },
  { id: "news", label: "News" },
  { id: "contact", label: "Contact" },
];

/** Maps a sub-route tab onto the in-page section it should scroll to. */
const TAB_ANCHOR: Record<CollegeTab, string> = {
  overview: "overview",
  "courses-fees": "courses-fees",
  placements: "placements",
  admission: "admissions",
  reviews: "reviews",
};

function Block(props: { id: string; title: string; children: JSX.Element }) {
  return (
    <section id={props.id} class="scroll-mt-28 border-b border-[var(--color-line)] py-8">
      <h2 class="text-2xl font-bold mb-4">{props.title}</h2>
      {props.children}
    </section>
  );
}

export default function CollegeDetail(props: { slugId: string; tab?: CollegeTab }) {
  const parsed = () => parseSlugId(props.slugId);
  const data = createAsync(() => collegeQuery(parsed().slug, parsed().id));
  const [active, setActive] = createSignal<string>(
    props.tab ? TAB_ANCHOR[props.tab] : "overview",
  );

  // On a sub-route, scroll to the matching section once mounted on the client.
  onMount(() => {
    if (isServer) return;
    const target = props.tab ? TAB_ANCHOR[props.tab] : "";
    if (target && target !== "overview") {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
    }
  });

  return (
    <Show when={data()} fallback={<LoadingBlock label="Loading college" />}>
      {(d) => {
        const h = () => d().header;
        const basePath = () => `/college/${props.slugId}`;
        const path = () =>
          props.tab && props.tab !== "overview" ? `${basePath()}/${props.tab}` : basePath();
        const seoTitle = () =>
          props.tab && TAB_TITLE[props.tab]
            ? `${h().name} ${TAB_TITLE[props.tab]}: ${h().city}`
            : `${h().name}: Courses, Fees, Admission and Placements`;
        const citySlug = () => h().city.toLowerCase().replace(/\s+/g, "-");
        const crumbs = () => [
          { name: "Home", path: "/" },
          { name: h().city, path: listingPath("mba", "mba", citySlug()) },
          { name: h().name, path: basePath() },
        ];

        // A section shows only when it has data, so missing optional blocks hide
        // cleanly (and drop out of the anchor nav) instead of rendering empty.
        const visible: Record<string, () => boolean> = {
          overview: () => true,
          "courses-fees": () => d().courses_fees.length > 0,
          admissions: () =>
            !!(
              d().admissions.process ||
              d().admissions.eligibility ||
              d().admissions.accepted_exams.length ||
              d().admissions.important_dates.length
            ),
          placements: () => d().placements.length > 0,
          rankings: () => d().rankings.length > 0,
          cutoffs: () => d().cutoffs.length > 0,
          gallery: () => d().media.length > 0,
          reviews: () => d().header.review_count > 0,
          news: () => true,
          contact: () => true,
        };
        const navSections = () => SECTIONS.filter((s) => visible[s.id]?.());

        return (
          <>
            <Seo
              title={seoTitle()}
              description={`${h().name}, ${h().city}. ${h().type} institute established ${h().established}. Courses, fees, admission process, placements, rankings and cutoffs, compiled for comparison.`}
              canonical={path()}
              og={h().cover}
              jsonLd={[breadcrumbLd(crumbs()), collegeLd(d(), basePath()), ...collegeCoursesLd(d(), basePath())]}
            />

            {/* Hero: cover slider + profile header */}
            <div class="bg-[var(--color-surface)]">
              <div class="container-x pt-4">
                <Breadcrumbs crumbs={crumbs()} />
              </div>

              {/* Cover image slider with dissolve (full width) */}
              <div class="relative mt-3 h-48 sm:h-64 md:h-80 overflow-hidden">
                <HeroSlider />
                <div
                  aria-hidden="true"
                  class="absolute inset-0 z-[1] bg-gradient-to-t from-black/40 via-black/5 to-transparent"
                />
              </div>

              {/* Profile: logo overlaps the cover; name and the rest sit below it */}
              <div class="container-x pb-6">
                {/* Logo card overlapping the cover (only the logo overlaps) */}
                <div class="relative z-10 -mt-10 sm:-mt-12 grid place-items-center w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-xl)] bg-white border border-[var(--color-line)] shadow-md p-2.5">
                  <CollegeLogo
                    name={h().name}
                    logo={h().logo}
                    id={h().id}
                    class="max-h-full max-w-full text-2xl rounded-[var(--radius-md)]"
                  />
                </div>

                {/* Name + meta + actions, below the cover on white */}
                <div class="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <h1 class="text-2xl md:text-3xl font-extrabold break-words leading-tight">
                      {h().name}
                    </h1>
                    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <For each={h().approvals}>
                        {(a) => (
                          <span class="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink)]/80">
                            {a}
                          </span>
                        )}
                      </For>
                      <Show when={h().rating > 0}>
                        <span class="inline-flex items-center gap-1.5">
                          <span aria-hidden="true" class="text-[var(--color-warning)]">
                            <For each={[0, 1, 2, 3, 4]}>
                              {(i) => <span>{i < Math.round(h().rating) ? "★" : "☆"}</span>}
                            </For>
                          </span>
                          <span class="text-sm font-semibold">{h().rating.toFixed(1)}</span>
                          <span class="text-sm text-[var(--color-muted)]">
                            {h().review_count} reviews
                          </span>
                        </span>
                      </Show>
                    </div>
                    <p class="mt-2 text-sm text-[var(--color-muted)]">
                      {h().city}, {h().state} · {h().type} · Established {h().established}
                    </p>
                    <div class="mt-2 flex items-center gap-2 text-sm">
                      <span class="text-[var(--color-muted)]">Not sure what fits you?</span>
                      <LeadTrigger
                        sourcePage={path()}
                        courseInterest={d().courses_fees[0]?.course}
                        defaultCity={h().city}
                        heading={`Get guidance for ${h().short_name}`}
                        label="Talk to an advisor"
                        variant="ghost"
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Actions: guidance-level only (compliance: never apply to a college) */}
                  <div class="flex flex-wrap items-center gap-2 lg:justify-end lg:pt-1 shrink-0">
                    <LeadTrigger
                      sourcePage={path()}
                      courseInterest={d().courses_fees[0]?.course}
                      defaultCity={h().city}
                      heading={`Get admission guidance for ${h().short_name}`}
                      label="Get admission guidance"
                      variant="accent"
                    />
                    <LinkButton href={listingPath("mba", "mba", citySlug())} variant="outline">
                      Compare colleges
                    </LinkButton>
                    <LeadTrigger
                      sourcePage={path()}
                      courseInterest={d().courses_fees[0]?.course}
                      defaultCity={h().city}
                      heading={`Get the prospectus for ${h().short_name}`}
                      label="Download brochure"
                      variant="ghost"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky in-page tab / anchor nav */}
            <nav
              aria-label="Sections"
              class="sticky top-16 z-30 bg-[var(--color-surface)] border-b border-[var(--color-line)] overflow-x-auto"
            >
              <div class="container-x flex gap-1">
                <For each={navSections()}>
                  {(s) => (
                    <a
                      href={`${basePath()}#${s.id}`}
                      onClick={() => setActive(s.id)}
                      aria-current={active() === s.id ? "location" : undefined}
                      class="whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 transition-colors"
                      classList={{
                        "border-primary-600 text-primary-700": active() === s.id,
                        "border-transparent hover:text-primary-700": active() !== s.id,
                      }}
                    >
                      {s.label}
                    </a>
                  )}
                </For>
              </div>
            </nav>

            <div class="container-x grid gap-8 lg:grid-cols-[1fr_20rem] py-8">
              <div class="min-w-0">
                {/* Overview */}
                <Block id="overview" title="Overview">
                  <p class="text-[var(--color-ink)]/90 max-w-3xl">{d().overview.description}</p>
                  <Show when={d().overview.highlights.length}>
                    <ul class="mt-4 grid gap-2 sm:grid-cols-2">
                      <For each={d().overview.highlights}>
                        {(hl) => (
                          <li class="flex items-start gap-2 text-sm">
                            <span aria-hidden="true" class="text-primary-600 mt-0.5">
                              ✓
                            </span>
                            <span>{hl}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                  <dl class="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                    <Show when={d().overview.campus_size}>
                      <div class="flex gap-2">
                        <dt class="text-[var(--color-muted)]">Campus</dt>
                        <dd class="font-medium">{d().overview.campus_size}</dd>
                      </div>
                    </Show>
                    <Show when={d().overview.website}>
                      <div class="flex gap-2">
                        <dt class="text-[var(--color-muted)]">Website</dt>
                        <dd class="font-medium">
                          <a
                            href={d().overview.website}
                            rel="nofollow noopener"
                            target="_blank"
                            class="text-primary-700 hover:underline"
                          >
                            Official site
                          </a>
                        </dd>
                      </div>
                    </Show>
                  </dl>
                </Block>

                {/* Courses & Fees */}
                <Show when={visible["courses-fees"]()}>
                <Block id="courses-fees" title="Courses & Fees">
                  <div class="space-y-3">
                    <For each={d().courses_fees}>
                      {(c) => (
                        <details class="group rounded-[var(--radius-md)] border border-[var(--color-line)]">
                          <summary class="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 list-none">
                            <span class="font-semibold min-w-0 break-words">{c.course}</span>
                            <span class="flex items-center gap-4 text-sm shrink-0">
                              <span class="text-[var(--color-muted)] hidden sm:inline">
                                {c.duration}
                              </span>
                              <span class="font-medium">{c.total_fee}</span>
                              <span
                                aria-hidden="true"
                                class="text-[var(--color-muted)] transition-transform group-open:rotate-45"
                              >
                                +
                              </span>
                            </span>
                          </summary>
                          <div class="px-4 pb-4 text-sm space-y-2">
                            <p>
                              <span class="text-[var(--color-muted)]">Duration: </span>
                              {c.duration}
                            </p>
                            <p>
                              <span class="text-[var(--color-muted)]">Eligibility: </span>
                              {c.eligibility}
                            </p>
                            <p class="flex flex-wrap items-center gap-1.5">
                              <span class="text-[var(--color-muted)]">Exams accepted: </span>
                              <For each={c.exams_accepted}>
                                {(e) => <Badge>{e}</Badge>}
                              </For>
                            </p>
                          </div>
                        </details>
                      )}
                    </For>
                  </div>
                </Block>
                </Show>

                {/* Admissions */}
                <Show when={visible.admissions()}>
                <Block id="admissions" title="Admissions">
                  <div class="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 class="font-semibold mb-1">Process</h3>
                      <p class="text-sm text-[var(--color-ink)]/90">{d().admissions.process}</p>
                      <h3 class="font-semibold mt-4 mb-1">Eligibility</h3>
                      <p class="text-sm text-[var(--color-ink)]/90">
                        {d().admissions.eligibility}
                      </p>
                      <div class="mt-4 flex flex-wrap items-center gap-1.5">
                        <span class="text-sm text-[var(--color-muted)]">Accepted exams:</span>
                        <For each={d().admissions.accepted_exams}>
                          {(e) => <Badge tone="primary">{e}</Badge>}
                        </For>
                      </div>
                    </div>
                    <div>
                      <h3 class="font-semibold mb-2">Important dates</h3>
                      <ul class="space-y-2 text-sm">
                        <For each={d().admissions.important_dates}>
                          {(dt) => (
                            <li class="flex justify-between gap-4 border-b border-[var(--color-line)] pb-1">
                              <span class="text-[var(--color-muted)]">{dt.label}</span>
                              <span class="font-medium">{dt.date}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  </div>
                </Block>
                </Show>

                {/* Placements */}
                <Show when={visible.placements()}>
                <Block id="placements" title="Placements">
                  <Show when={d().placements.length}>
                    <div class="overflow-x-auto">
                      <table class="w-full text-sm border-collapse">
                        <thead>
                          <tr class="text-left text-[var(--color-muted)] border-b border-[var(--color-line)]">
                            <th class="py-2 pr-4 font-medium">Year</th>
                            <th class="py-2 pr-4 font-medium">Highest</th>
                            <th class="py-2 pr-4 font-medium">Average</th>
                            <th class="py-2 pr-4 font-medium">Median</th>
                            <th class="py-2 pr-4 font-medium">Placement rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          <For each={d().placements}>
                            {(p) => (
                              <tr class="border-b border-[var(--color-line)]">
                                <td class="py-2 pr-4 font-medium">{p.year}</td>
                                <td class="py-2 pr-4">{p.highest_package}</td>
                                <td class="py-2 pr-4">{p.average_package}</td>
                                <td class="py-2 pr-4">{p.median_package}</td>
                                <td class="py-2 pr-4">{p.placement_rate}</td>
                              </tr>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
                    <div class="mt-4 text-sm">
                      <span class="text-[var(--color-muted)]">Top recruiters: </span>
                      {d().placements[0]?.top_recruiters.join(", ")}
                    </div>
                  </Show>
                </Block>
                </Show>

                {/* Rankings */}
                <Show when={visible.rankings()}>
                <Block id="rankings" title="Rankings & Ratings">
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                      <thead>
                        <tr class="text-left text-[var(--color-muted)] border-b border-[var(--color-line)]">
                          <th class="py-2 pr-4 font-medium">Agency</th>
                          <th class="py-2 pr-4 font-medium">Rank</th>
                          <th class="py-2 pr-4 font-medium">Category</th>
                          <th class="py-2 pr-4 font-medium">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={d().rankings}>
                          {(r) => (
                            <tr class="border-b border-[var(--color-line)]">
                              <td class="py-2 pr-4">{r.agency}</td>
                              <td class="py-2 pr-4 font-semibold">{r.rank}</td>
                              <td class="py-2 pr-4">{r.category}</td>
                              <td class="py-2 pr-4">{r.year}</td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Block>
                </Show>

                {/* Cutoffs */}
                <Show when={visible.cutoffs()}>
                <Block id="cutoffs" title="Cutoffs">
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                      <thead>
                        <tr class="text-left text-[var(--color-muted)] border-b border-[var(--color-line)]">
                          <th class="py-2 pr-4 font-medium">Exam</th>
                          <th class="py-2 pr-4 font-medium">Category</th>
                          <th class="py-2 pr-4 font-medium">Round</th>
                          <th class="py-2 pr-4 font-medium">Cutoff</th>
                          <th class="py-2 pr-4 font-medium">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={d().cutoffs}>
                          {(c) => (
                            <tr class="border-b border-[var(--color-line)]">
                              <td class="py-2 pr-4">{c.exam}</td>
                              <td class="py-2 pr-4">{c.category}</td>
                              <td class="py-2 pr-4">{c.round}</td>
                              <td class="py-2 pr-4 font-medium">{c.cutoff}</td>
                              <td class="py-2 pr-4">{c.year}</td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Block>
                </Show>

                {/* Gallery */}
                <Show when={visible.gallery()}>
                <Block id="gallery" title="Gallery">
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <For each={d().media}>
                      {(m) => (
                        <figure class="rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-line)]">
                          <img
                            src={m.url || "/placeholders/campus-cover.svg"}
                            alt={m.caption}
                            loading="lazy"
                            decoding="async"
                            onError={(e) =>
                              (e.currentTarget.src = "/placeholders/campus-cover.svg")
                            }
                            class="w-full h-32 object-cover bg-[var(--color-canvas)]"
                          />
                          <figcaption class="px-2 py-1 text-xs text-[var(--color-muted)]">
                            {m.caption}
                          </figcaption>
                        </figure>
                      )}
                    </For>
                  </div>
                </Block>
                </Show>

                {/* Reviews (placeholder in v1) */}
                <Show when={visible.reviews()}>
                <Block id="reviews" title="Reviews & Q&A">
                  <p class="text-sm text-[var(--color-muted)]">
                    Verified student reviews and a questions and answers section are coming soon.
                    We publish reviews only after basic verification to keep this section useful.
                  </p>
                </Block>
                </Show>

                {/* News (placeholder) */}
                <Block id="news" title="News & Updates">
                  <p class="text-sm text-[var(--color-muted)]">
                    Admission notices and campus updates for this institute will appear here.
                  </p>
                </Block>

                {/* Contact & Location with per-page guidance form */}
                <Block id="contact" title="Contact & Location">
                  <div class="grid gap-6 md:grid-cols-2">
                    <div class="text-sm space-y-1">
                      <p>{d().contact.address}</p>
                      <p>
                        {d().contact.city}, {d().contact.state} {d().contact.pincode}
                      </p>
                      <Show when={d().contact.phone}>
                        <p>
                          <span class="text-[var(--color-muted)]">Phone: </span>
                          {d().contact.phone}
                        </p>
                      </Show>
                      <Show when={d().contact.email}>
                        <p>
                          <span class="text-[var(--color-muted)]">Email: </span>
                          {d().contact.email}
                        </p>
                      </Show>
                      <Show when={d().contact.map_embed}>
                        <div
                          class="mt-3 rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-line)]"
                          // eslint-disable-next-line solid/no-innerhtml
                          innerHTML={d().contact.map_embed}
                        />
                      </Show>
                    </div>
                    <Card class="p-5 bg-primary-50 border-primary-100">
                      <LeadForm
                        sourcePage={path()}
                        courseInterest={d().courses_fees[0]?.course}
                        defaultCity={d().header.city}
                        heading="Get admission guidance for this institute"
                      />
                    </Card>
                  </div>
                </Block>

                {/* Operator disclosure (compliance item 5) */}
                <p class="mt-6 text-xs text-[var(--color-muted)] max-w-3xl">
                  {d().operator_disclosure}
                </p>
              </div>

              {/* Sticky side rail: quick guidance CTA */}
              <aside class="hidden lg:block">
                <Card class="p-5 lg:sticky lg:top-32 bg-primary-50 border-primary-100">
                  <h2 class="font-semibold text-lg">Compare and decide</h2>
                  <p class="mt-2 text-sm text-[var(--color-muted)]">
                    Get free guidance on courses, fees and admission for {h().short_name} and
                    similar institutes.
                  </p>
                  <div class="mt-4 grid gap-2">
                    <LinkButton href="#contact" variant="accent" size="md">
                      Get free guidance
                    </LinkButton>
                    <LinkButton
                      href={listingPath("mba", "mba", citySlug())}
                      variant="outline"
                      size="md"
                    >
                      See other colleges in {h().city}
                    </LinkButton>
                  </div>
                </Card>
              </aside>
            </div>
          </>
        );
      }}
    </Show>
  );
}
