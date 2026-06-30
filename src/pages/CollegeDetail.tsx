import { createAsync } from "@solidjs/router";
import { For, Show, createSignal, onMount, type JSX } from "solid-js";
import { isServer } from "solid-js/web";
import Seo from "~/components/Seo";
import Breadcrumbs from "~/components/Breadcrumbs";
import LeadForm from "~/components/LeadForm";
import LeadTrigger from "~/components/LeadTrigger";
import ReviewsBlock from "~/components/ReviewsBlock";
import QABlock from "~/components/QABlock";
import CompareToggle from "~/components/CompareToggle";
import RelatedArticles from "~/components/RelatedArticles";
import SaveButton from "~/components/SaveButton";
import TrackStatus from "~/components/TrackStatus";
import CollegeCover from "~/components/CollegeCover";
import Lightbox from "~/components/Lightbox";
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
  { id: "scholarships", label: "Scholarships" },
  { id: "facilities", label: "Facilities" },
  { id: "gallery", label: "Gallery" },
  { id: "reviews", label: "Reviews" },
  { id: "qa", label: "Q&A" },
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

const GENDER_LABEL: Record<string, string> = {
  CO_ED: "Co-Ed",
  GIRLS: "Girls",
  BOYS: "Boys",
};
const SCHOLARSHIP_TYPE: Record<string, string> = {
  MERIT: "Merit-based",
  NEED: "Need-based",
  OTHER: "Other",
};
const FACILITY_CAT: Record<string, string> = {
  HOSTEL: "Hostel",
  LIBRARY: "Library",
  LABS: "Labs",
  CAFETERIA: "Cafeteria",
  SPORTS: "Sports",
  WIFI: "Wi-Fi",
  TRANSPORT: "Transport",
  MEDICAL: "Medical",
  OTHER: "Other",
};
const FACILITY_ORDER = Object.keys(FACILITY_CAT);

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
  // deferStream so SSR waits for the college before flushing the head: the
  // title, canonical, OG/Twitter and JSON-LD (CollegeOrUniversity, Course) must
  // be in the server HTML for crawlers, not applied after hydration.
  const data = createAsync(() => collegeQuery(parsed().slug, parsed().id), {
    deferStream: true,
  });
  const [active, setActive] = createSignal<string>(
    props.tab ? TAB_ANCHOR[props.tab] : "overview",
  );
  // Gallery lightbox: index of the open image (null = closed).
  const [lightbox, setLightbox] = createSignal<number | null>(null);

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
        // Lead-form course dropdown options, restricted to THIS college's
        // offerings (name + backend slug). LeadForm dedupes by slug.
        const courseOptions = () =>
          d()
            .courses_fees.filter((c) => c.course_slug)
            .map((c) => ({ name: c.course, slug: c.course_slug }));
        const basePath = () => `/college/${props.slugId}`;
        const path = () =>
          props.tab && props.tab !== "overview" ? `${basePath()}/${props.tab}` : basePath();
        const seoTitle = () =>
          props.tab && TAB_TITLE[props.tab]
            ? `${h().name} ${TAB_TITLE[props.tab]}: ${h().city}`
            : `${h().name}: Courses, Fees, Admission and Placements`;
        const citySlug = () => h().city.toLowerCase().replace(/\s+/g, "-");
        const galleryImages = () =>
          d()
            .media.filter((mm) => mm.category !== "HERO" && mm.url)
            .map((mm) => ({ url: mm.url, caption: mm.caption }));
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
          placements: () => {
            const p = d().placements;
            const s = p.summary;
            return !!(
              s.highest_package ||
              s.average_package ||
              s.median_package ||
              s.placement_percentage != null ||
              s.students_placed != null ||
              p.recruiters.length ||
              p.highlights.length
            );
          },
          rankings: () => d().rankings.length > 0,
          cutoffs: () => d().cutoffs.length > 0,
          scholarships: () => d().scholarships.length > 0,
          facilities: () => d().facilities.length > 0,
          gallery: () => d().media.some((m) => m.category !== "HERO"),
          // Always reachable so the empty-state prompts and submission forms show.
          reviews: () => true,
          qa: () => true,
          news: () => true,
          contact: () => hasAnyContact(),
        };
        const navSections = () => SECTIONS.filter((s) => visible[s.id]?.());

        const ct = () => d().contact;
        const hasAnyContact = () =>
          !!(
            ct().address ||
            ct().phone ||
            ct().email ||
            ct().website ||
            (ct().latitude != null && ct().longitude != null)
          );
        const hasCoords = () => ct().latitude != null && ct().longitude != null;
        const hostelHasInfo = () => {
          const ho = d().hostel;
          return ho.available != null || ho.boys != null || ho.girls != null || !!ho.fee;
        };
        const facilityGroups = () => {
          const map = new Map<string, { category: string; name: string; description: string }[]>();
          for (const f of d().facilities) {
            if (!map.has(f.category)) map.set(f.category, []);
            map.get(f.category)!.push(f);
          }
          return FACILITY_ORDER.filter((c) => map.has(c)).map((c) => ({
            category: c,
            items: map.get(c)!,
          }));
        };

        return (
          <>
            <Seo
              title={seoTitle()}
              description={`${h().name}, ${h().city}. ${h().type} institute${h().established ? ` established ${h().established}` : ""}. Courses, fees, admission process, placements, rankings and cutoffs, compiled for comparison.`}
              canonical={path()}
              og={h().cover}
              jsonLd={[breadcrumbLd(crumbs()), collegeLd(d(), basePath()), ...collegeCoursesLd(d(), basePath())]}
            />

            {/* Hero: cover slider + profile header */}
            <div class="bg-[var(--color-surface)]">
              <div class="container-x pt-4">
                <Breadcrumbs crumbs={crumbs()} />
              </div>

              {/* Cover: a slider of the college's own images (HERO first), else
                  the bundled neutral slider. */}
              <div class="relative mt-3 h-72 sm:h-96 md:h-[30rem] lg:h-[36rem] overflow-hidden">
                <CollegeCover media={d().media} name={h().name} />
                <div
                  aria-hidden="true"
                  class="absolute inset-0 z-[1] bg-gradient-to-t from-black/45 via-black/5 to-transparent"
                />
              </div>

              {/* Profile header. Only the logo overlaps the cover; the name and
                  everything else sit fully on white so nothing is cropped. */}
              <div class="container-x pb-6">
                <div class="relative z-10 -mt-12 inline-grid h-24 w-24 place-items-center rounded-[var(--radius-xl)] bg-white p-3 shadow-lg ring-1 ring-black/5 sm:-mt-14 sm:h-28 sm:w-28">
                  <CollegeLogo
                    name={h().name}
                    logo={h().logo}
                    id={h().id}
                    class="max-h-full max-w-full rounded-[var(--radius-md)] text-2xl"
                  />
                </div>

                <div class="mt-3 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <h1 class="text-2xl font-extrabold leading-tight break-words md:text-3xl">
                      {h().name}
                    </h1>
                    <p class="mt-1.5 text-sm text-[var(--color-muted)]">
                      {[
                        h().city,
                        h().type,
                        GENDER_LABEL[d().gender_intake] ?? "",
                        h().established ? `Est. ${h().established}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div class="mt-2.5 flex flex-wrap items-center gap-2">
                      <For each={h().approvals}>
                        {(a) => (
                          <span class="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink)]/80">
                            {a}
                          </span>
                        )}
                      </For>
                      <Show when={h().rating > 0}>
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning)]/10 px-2.5 py-0.5">
                          <span aria-hidden="true" class="text-[var(--color-warning)]">★</span>
                          <span class="text-sm font-bold">{h().rating.toFixed(1)}</span>
                          <span class="text-xs text-[var(--color-muted)]">({h().review_count})</span>
                        </span>
                      </Show>
                    </div>
                  </div>

                  {/* Actions: guidance-level only (compliance: never apply to a college) */}
                  <div class="flex flex-wrap items-center gap-2.5 lg:shrink-0 lg:justify-end lg:pt-1">
                    <LeadTrigger
                      sourcePage={path()}
                      courseInterest={d().courses_fees[0]?.course}
                      courseOptions={courseOptions()}
                      defaultCity={h().city}
                      heading={`Get admission guidance for ${h().name}`}
                      label="Get admission guidance"
                      variant="accent"
                    />
                    <SaveButton collegeId={parsed().id} variant="button" />
                    <CompareToggle
                      college={{
                        id: parsed().id,
                        slug: parsed().slug,
                        name: h().name,
                        logo: h().logo,
                        city: h().city,
                        type: h().type,
                      }}
                      variant="button"
                    />
                    {/* Brochure is a lead magnet: only when a PDF exists, gated
                        behind the lead form; the PDF opens after a successful submit. */}
                    <Show when={d().brochure_url}>
                      <LeadTrigger
                        sourcePage={path()}
                        courseInterest={d().courses_fees[0]?.course}
                      courseOptions={courseOptions()}
                        defaultCity={h().city}
                        heading={`Download the ${h().name} brochure`}
                        label="Download brochure"
                        variant="ghost"
                        onLeadSuccess={() => {
                          if (!isServer) window.open(d().brochure_url, "_blank", "noopener");
                        }}
                      />
                    </Show>
                  </div>
                </div>

                <div class="mt-3 flex items-center gap-2 text-sm">
                  <span class="text-[var(--color-muted)]">Not sure what fits you?</span>
                  <LeadTrigger
                    sourcePage={path()}
                    courseInterest={d().courses_fees[0]?.course}
                    defaultCity={h().city}
                    heading={`Get guidance for ${h().name}`}
                    label="Talk to an advisor"
                    variant="ghost"
                    size="sm"
                  />
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

            <div class="container-x grid gap-8 lg:grid-cols-[1fr_22rem] py-8">
              <div class="min-w-0">
                {/* Overview */}
                <Block id="overview" title="Overview">
                  <p class="text-[var(--color-ink)]/90 max-w-3xl">
                    {d().overview.description ||
                      `${h().name} is a ${h().type.toLowerCase()} institution in ${h().city}${
                        h().established ? `, established in ${h().established}` : ""
                      }${h().affiliation ? `, affiliated to ${h().affiliation}` : ""}.`}
                  </p>
                  {/* Key facts (render only what exists, so a sparse record still
                      looks intentional). */}
                  <dl class="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <Show when={h().established}>
                      <div class="flex gap-2">
                        <dt class="text-[var(--color-muted)]">Established</dt>
                        <dd class="font-medium">{h().established}</dd>
                      </div>
                    </Show>
                    <Show when={h().affiliation}>
                      <div class="flex gap-2">
                        <dt class="text-[var(--color-muted)]">Affiliation</dt>
                        <dd class="font-medium">{h().affiliation}</dd>
                      </div>
                    </Show>
                    <Show when={h().approvals.length}>
                      <div class="flex gap-2">
                        <dt class="text-[var(--color-muted)]">Approvals</dt>
                        <dd class="font-medium">{h().approvals.join(", ")}</dd>
                      </div>
                    </Show>
                  </dl>
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
                              <span class="font-medium" classList={{ "text-[var(--color-muted)]": !c.total_fee }}>
                                {c.total_fee || "Fees on request"}
                              </span>
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
                            {/* Null fee -> turn the missing-fee moment into a lead. */}
                            <Show when={!c.total_fee}>
                              <div class="flex flex-wrap items-center gap-2 pt-1">
                                <span class="text-[var(--color-muted)]">
                                  Fees for {c.course} are available on request.
                                </span>
                                <LeadTrigger
                                  sourcePage={path()}
                                  courseInterest={c.course}
                                  defaultCity={h().city}
                                  heading={`Get fee details for ${c.course} at ${h().name}`}
                                  label="Get fee details"
                                  variant="outline"
                                  size="sm"
                                />
                              </div>
                            </Show>
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
                  {(() => {
                    const p = () => d().placements;
                    const s = () => p().summary;
                    const stats = () =>
                      [
                        { label: "Highest package", value: s().highest_package },
                        { label: "Average package", value: s().average_package },
                        { label: "Median package", value: s().median_package },
                        {
                          label: "Placement rate",
                          value: s().placement_percentage != null ? `${s().placement_percentage}%` : "",
                        },
                        {
                          label: "Students placed",
                          value: s().students_placed != null ? String(s().students_placed) : "",
                        },
                      ].filter((x) => x.value);
                    return (
                      <>
                        <Show when={stats().length}>
                          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            <For each={stats()}>
                              {(stat) => (
                                <div class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
                                  <p class="text-xl font-extrabold text-primary-700">{stat.value}</p>
                                  <p class="mt-1 text-xs text-[var(--color-muted)]">{stat.label}</p>
                                </div>
                              )}
                            </For>
                          </div>
                          <Show when={s().year}>
                            <p class="mt-2 text-xs text-[var(--color-muted)]">
                              Placement data for {s().year}.
                            </p>
                          </Show>
                        </Show>

                        <Show when={p().recruiters.length}>
                          <h3 class="mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                            Top recruiters
                          </h3>
                          <div class="mt-2 flex flex-wrap gap-2">
                            <For each={p().recruiters}>
                              {(rec) => (
                                <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium">
                                  {rec}
                                </span>
                              )}
                            </For>
                          </div>
                        </Show>

                        <Show when={p().highlights.length}>
                          <h3 class="mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                            Placement highlights
                          </h3>
                          <ul class="mt-2 grid gap-2 sm:grid-cols-2">
                            <For each={p().highlights}>
                              {(hl) => (
                                <li class="flex items-start gap-2 text-sm">
                                  <span aria-hidden="true" class="mt-0.5 text-[var(--color-success)]">
                                    ✓
                                  </span>
                                  <span>{hl}</span>
                                </li>
                              )}
                            </For>
                          </ul>
                        </Show>
                      </>
                    );
                  })()}
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

                {/* Scholarships */}
                <Show when={visible.scholarships()}>
                <Block id="scholarships" title="Scholarships">
                  <div class="grid gap-3 sm:grid-cols-2">
                    <For each={d().scholarships}>
                      {(s) => (
                        <div class="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4">
                          <div class="flex items-start justify-between gap-2">
                            <h3 class="font-semibold text-[var(--color-ink)]">{s.name}</h3>
                            <Show when={s.type}>
                              <Badge tone="primary">{SCHOLARSHIP_TYPE[s.type] ?? s.type}</Badge>
                            </Show>
                          </div>
                          <Show when={s.amount_or_benefit}>
                            <p class="mt-1.5 text-sm font-semibold text-primary-700">
                              {s.amount_or_benefit}
                            </p>
                          </Show>
                          <Show when={s.eligibility}>
                            <p class="mt-1 text-sm text-[var(--color-muted)]">{s.eligibility}</p>
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </Block>
                </Show>

                {/* Facilities (grouped by category) */}
                <Show when={visible.facilities()}>
                <Block id="facilities" title="Facilities">
                  <div class="space-y-5">
                    <For each={facilityGroups()}>
                      {(g) => (
                        <div>
                          <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                            {FACILITY_CAT[g.category] ?? g.category}
                          </h3>
                          <div class="flex flex-wrap gap-2">
                            <For each={g.items}>
                              {(f) => (
                                <span
                                  title={f.description || undefined}
                                  class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm"
                                >
                                  <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-primary-500" />
                                  {f.name}
                                </span>
                              )}
                            </For>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Block>
                </Show>

                {/* Hostel (small block; not a separate nav tab) */}
                <Show when={hostelHasInfo()}>
                <section id="hostel" class="scroll-mt-28 border-b border-[var(--color-line)] py-8">
                  <h2 class="mb-4 text-2xl font-bold">Hostel</h2>
                  <div class="flex flex-wrap gap-2.5">
                    <Show when={d().hostel.boys != null}>
                      <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm">
                        Boys hostel: <span class="font-semibold">{d().hostel.boys ? "Available" : "Not available"}</span>
                      </span>
                    </Show>
                    <Show when={d().hostel.girls != null}>
                      <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm">
                        Girls hostel: <span class="font-semibold">{d().hostel.girls ? "Available" : "Not available"}</span>
                      </span>
                    </Show>
                    <Show when={d().hostel.available != null && d().hostel.boys == null && d().hostel.girls == null}>
                      <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm">
                        Hostel: <span class="font-semibold">{d().hostel.available ? "Available" : "Not available"}</span>
                      </span>
                    </Show>
                    <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-1.5 text-sm">
                      <span class="font-semibold text-primary-700">
                        {d().hostel.fee ? `Hostel fees ${d().hostel.fee}` : "Hostel fees on request"}
                      </span>
                    </span>
                  </div>
                </section>
                </Show>

                {/* Gallery */}
                <Show when={visible.gallery()}>
                <Block id="gallery" title="Gallery">
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <For each={galleryImages()}>
                      {(m, i) => (
                        <button
                          type="button"
                          onClick={() => setLightbox(i())}
                          aria-label={`View image ${i() + 1}`}
                          class="group relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-canvas)]"
                        >
                          <img
                            src={m.url || "/placeholders/campus-cover.svg"}
                            alt={m.caption || `${h().name} photo ${i() + 1}`}
                            loading="lazy"
                            decoding="async"
                            onError={(e) =>
                              (e.currentTarget.src = "/placeholders/campus-cover.svg")
                            }
                            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span
                            aria-hidden="true"
                            class="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20"
                          />
                          <Show when={m.caption}>
                            <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs text-white">
                              {m.caption}
                            </span>
                          </Show>
                        </button>
                      )}
                    </For>
                  </div>
                </Block>
                </Show>

                <Lightbox
                  images={galleryImages()}
                  index={lightbox()}
                  onClose={() => setLightbox(null)}
                  onIndex={setLightbox}
                />

                {/* Reviews */}
                <Block id="reviews" title="Reviews">
                  <ReviewsBlock slugId={props.slugId} collegeId={parsed().id} />
                </Block>

                {/* Q&A */}
                <Block id="qa" title="Questions & Answers">
                  <QABlock slugId={props.slugId} collegeId={parsed().id} />
                </Block>

                {/* News (placeholder) */}
                <Block id="news" title="News & Updates">
                  <p class="text-sm text-[var(--color-muted)]">
                    Admission notices and campus updates for this institute will appear here.
                  </p>
                </Block>

                {/* Contact & Location (hidden when there are no contact fields) */}
                <Show when={visible.contact()}>
                <Block id="contact" title="Contact & Location">
                  <div class="grid gap-6 md:grid-cols-2">
                    <div class="space-y-2.5 text-sm">
                      <Show when={ct().address}>
                        <p class="flex items-start gap-2">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="2.5" />
                          </svg>
                          <span>
                            {[ct().address, ct().city, ct().state].filter(Boolean).join(", ")}
                          </span>
                        </p>
                      </Show>
                      <Show when={ct().phone}>
                        <p class="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                          </svg>
                          <a href={`tel:${ct().phone}`} class="font-medium text-primary-700 hover:underline">
                            {ct().phone}
                          </a>
                        </p>
                      </Show>
                      <Show when={ct().email}>
                        <p class="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="m3 7 9 6 9-6" />
                          </svg>
                          <a href={`mailto:${ct().email}`} class="font-medium text-primary-700 hover:underline">
                            {ct().email}
                          </a>
                        </p>
                      </Show>
                      <Show when={ct().website}>
                        <p class="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                          </svg>
                          <a href={ct().website} target="_blank" rel="nofollow noopener" class="font-medium text-primary-700 hover:underline">
                            Official website
                          </a>
                        </p>
                      </Show>
                      <Show when={hasCoords()}>
                        <iframe
                          title={`${h().name} location map`}
                          src={`https://www.google.com/maps?q=${ct().latitude},${ct().longitude}&z=15&output=embed`}
                          loading="lazy"
                          referrerpolicy="no-referrer-when-downgrade"
                          class="mt-1 h-56 w-full rounded-[var(--radius-md)] border border-[var(--color-line)]"
                        />
                      </Show>
                    </div>
                    {/* Mobile/tablet: guidance form inline; desktop uses the rail. */}
                    <Card class="p-5 bg-primary-50 border-primary-100 lg:hidden">
                      <LeadForm
                        sourcePage={path()}
                        courseInterest={d().courses_fees[0]?.course}
                      courseOptions={courseOptions()}
                        defaultCity={d().header.city}
                        heading="Get admission guidance for this institute"
                      />
                    </Card>
                  </div>
                </Block>
                </Show>

                {/* Mobile guidance form when Contact is hidden (no contact data),
                    so phones always have a form even on a sparse college. */}
                <Show when={!hasAnyContact()}>
                  <Card class="my-8 p-5 bg-primary-50 border-primary-100 lg:hidden">
                    <LeadForm
                      sourcePage={path()}
                      courseInterest={d().courses_fees[0]?.course}
                      courseOptions={courseOptions()}
                      defaultCity={d().header.city}
                      heading="Get admission guidance for this institute"
                    />
                  </Card>
                </Show>

                <RelatedArticles college={parsed().slug} />

                {/* Operator disclosure (compliance item 5) */}
                <p class="mt-6 text-xs text-[var(--color-muted)] max-w-3xl">
                  {d().operator_disclosure}
                </p>
              </div>

              {/* Sticky side rail: guidance form, then the compare CTA */}
              <aside class="hidden lg:block">
                <div class="lg:sticky lg:top-32 space-y-6">
                  <Card class="p-5">
                    <TrackStatus collegeId={parsed().id} />
                  </Card>
                  <Card class="p-5 bg-primary-50 border-primary-100">
                    <LeadForm
                      sourcePage={path()}
                      courseInterest={d().courses_fees[0]?.course}
                      courseOptions={courseOptions()}
                      defaultCity={d().header.city}
                      heading="Get admission guidance for this institute"
                      dense
                    />
                  </Card>
                  <Card class="p-5 bg-primary-50 border-primary-100">
                    <h2 class="font-semibold text-lg">Compare and decide</h2>
                    <p class="mt-2 text-sm text-[var(--color-muted)]">
                      Get free guidance on courses, fees and admission for {h().name} and
                      similar institutes.
                    </p>
                    <div class="mt-4 grid gap-2">
                      <LinkButton
                        href={listingPath("mba", "mba", citySlug())}
                        variant="outline"
                        size="md"
                      >
                        See other colleges in {h().city}
                      </LinkButton>
                    </div>
                  </Card>
                </div>
              </aside>
            </div>
          </>
        );
      }}
    </Show>
  );
}
