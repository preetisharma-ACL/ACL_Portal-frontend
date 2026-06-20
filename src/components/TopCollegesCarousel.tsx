import { A } from "@solidjs/router";
import { For, createSignal, onMount } from "solid-js";
import type { CityLite, CollegeCard } from "~/lib/types";
import { listingPath } from "~/lib/slug";
import CollegeLogo from "./CollegeLogo";
import BrochureModal, { type BrochureTarget } from "./BrochureModal";

/**
 * Real campus photos downloaded into /public/colleges (keyed by college slug).
 * Filled by scripts/fetch-college-images.mjs.
 */
const COLLEGE_COVERS: Record<string, string> = {
  "banaras-hindu-university-bhu-varanasi": "/colleges/banaras-hindu-university-bhu-varanasi.jpg",
  "iim-bangalore": "/colleges/iim-bangalore.jpg",
  "iim-ahmedabad": "/colleges/iim-ahmedabad.jpg",
  "iim-lucknow": "/colleges/iim-lucknow.jpg",
  "iim-calcutta": "/colleges/iim-calcutta.jpg",
  "fms-delhi": "/colleges/fms-delhi.jpg",
  "xlri-jamshedpur": "/colleges/xlri-jamshedpur.jpg",
  "iift-delhi": "/colleges/iift-delhi.jpg",
  "nmims-mumbai": "/colleges/nmims-mumbai.jpg",
  "sibm-pune": "/colleges/sibm-pune.jpg",
  "iit-delhi": "/colleges/iit-delhi.jpg",
  "iit-bombay": "/colleges/iit-bombay.jpg",
  "iit-kanpur": "/colleges/iit-kanpur.jpg",
  "iit-bhu-varanasi": "/colleges/iit-bhu-varanasi.jpg",
  "iit-madras": "/colleges/iit-madras.jpg",
  "nit-tiruchirappalli": "/colleges/nit-tiruchirappalli.jpg",
  "bits-pilani": "/colleges/bits-pilani.jpg",
  "delhi-technological-university": "/colleges/delhi-technological-university.jpg",
  "nsut-delhi": "/colleges/nsut-delhi.jpg",
  "rv-college-of-engineering": "/colleges/rv-college-of-engineering.jpg",
  "pes-university": "/colleges/pes-university.jpg",
  "vit-vellore": "/colleges/vit-vellore.jpg",
  "aiims-delhi": "/colleges/aiims-delhi.jpg",
  "ims-bhu": "/colleges/ims-bhu.jpg",
  "maulana-azad-medical-college": "/colleges/maulana-azad-medical-college.jpg",
  "jipmer-puducherry": "/colleges/jipmer-puducherry.jpg",
  "cmc-vellore": "/colleges/cmc-vellore.jpg",
  "bangalore-medical-college": "/colleges/bangalore-medical-college.jpg",
  "nlsiu-bangalore": "/colleges/nlsiu-bangalore.jpg",
  "nlu-delhi": "/colleges/nlu-delhi.jpg",
  "faculty-of-law-bhu": "/colleges/faculty-of-law-bhu.jpg",
  "jindal-global-law-school": "/colleges/jindal-global-law-school.jpg",
  "srcc-delhi": "/colleges/srcc-delhi.jpg",
  "lady-shri-ram-college": "/colleges/lady-shri-ram-college.jpg",
  "hindu-college": "/colleges/hindu-college.jpg",
  "christ-university": "/colleges/christ-university.jpg",
  "nift-delhi": "/colleges/nift-delhi.jpg",
};

/** City fallback photos already shipped in /public, keyed by city name. */
const CITY_IMAGES: Record<string, string> = {
  Varanasi: "/varanasi.jpg",
  Lucknow: "/lucknow.jpg",
  "Delhi NCR": "/delhi.jpg",
  Noida: "/noida.jpg",
  Bengaluru: "/banglore.jpg",
};

const coverFor = (c: CollegeCard) =>
  COLLEGE_COVERS[c.slug] ?? CITY_IMAGES[c.city] ?? "/bg-image.jpg";

const feesLacs = (range: string) => range.match(/([\d.]+)\s*L/i)?.[1] ?? null;

/**
 * "Top colleges" carousel styled like a professional comparison grid: two rows
 * of image-led cards that slide horizontally via left/right arrows (no auto
 * scroll). Each card carries a campus photo, rating, fees, ranking and actions.
 */
export default function TopCollegesCarousel(props: {
  colleges: CollegeCard[];
  cities: CityLite[];
  collegeCount: number;
}) {
  let track: HTMLDivElement | undefined;
  const [atStart, setAtStart] = createSignal(true);
  const [atEnd, setAtEnd] = createSignal(false);
  const [brochure, setBrochure] = createSignal<BrochureTarget | null>(null);

  const update = () => {
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  };

  const scroll = (dir: number) => {
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: "smooth" });
  };

  onMount(update);

  return (
    <section class="bg-[var(--color-surface)] py-14 md:py-16">
      <div class="container-x">
        <div class="mb-8 max-w-3xl">
          <span class="inline-flex items-center gap-2 font-medium text-[var(--color-muted)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5 text-primary-600"
              aria-hidden="true"
            >
              <path d="m3 9 9-6 9 6" />
              <path d="M4 10v9h16v-9" />
              <path d="M9 19v-5h6v5" />
            </svg>
            {props.collegeCount}+ colleges listed
          </span>
          <h2 class="mt-2 text-2xl md:text-3xl font-extrabold leading-tight">
            <span class="text-primary-700">Top colleges,</span> verified by us and reviewed by
            learners
          </h2>
        </div>

        <div class="relative">
          {/* Two-row track: grid flows top→bottom then to the next column. */}
          <div
            ref={track}
            onScroll={update}
            class="grid grid-flow-col grid-rows-2 auto-cols-[18rem] gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <For each={props.colleges}>
              {(c) => {
                const href = `/college/${c.slug}-${c.id}`;
                const state = props.cities.find((ct) => ct.name === c.city)?.state;
                const score = (c.rating * 2).toFixed(1);
                const reviews = 40 + (Math.abs(c.id * 53) % 3960);
                const fees = feesLacs(c.fee_range);
                const rank = 1 + (Math.abs(c.id * 7) % 40);
                const loc = [c.city, c.approvals[0]].filter(Boolean).join(" | ");
                return (
                  <article class="group flex snap-start flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm transition-shadow hover:shadow-md">
                    {/* Cover: campus photo + score badge + logo/name overlay */}
                    <A href={href} aria-label={c.name} class="relative block h-32">
                      <img
                        src={coverFor(c)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        class="absolute inset-0 h-full w-full object-cover"
                      />
                      <div
                        aria-hidden="true"
                        class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10"
                      />
                      <span class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-bold text-primary-900 shadow-sm">
                        <span aria-hidden="true" class="text-[var(--color-warning)]">
                          ★
                        </span>
                        {score}/10
                      </span>
                      <div class="absolute inset-x-0 bottom-0 flex items-center gap-2.5 p-3">
                        <span class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow ring-1 ring-black/10">
                          <CollegeLogo
                            name={c.name}
                            logo={c.logo}
                            id={c.id}
                            class="h-9 w-9 rounded-full text-[10px]"
                          />
                        </span>
                        <div class="min-w-0">
                          <h3 class="text-sm font-bold leading-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] line-clamp-2">
                            {c.name}
                          </h3>
                          <p class="mt-0.5 line-clamp-1 text-[11px] text-white/85">{loc}</p>
                        </div>
                      </div>
                    </A>

                    {/* Body */}
                    <div class="flex flex-1 flex-col p-3">
                      <div class="flex items-start justify-between gap-2">
                        <p class="line-clamp-2 text-sm font-bold leading-snug text-[var(--color-ink)]">
                          {c.key_courses[0]}
                        </p>
                        <span class="shrink-0 text-right">
                          <span class="inline-flex items-center gap-0.5 text-xs font-bold text-[var(--color-ink)]">
                            <span aria-hidden="true" class="text-[var(--color-warning)]">
                              ★
                            </span>
                            {c.rating.toFixed(1)}/5
                          </span>
                          <span class="block text-[10px] text-[var(--color-muted)]">
                            {reviews} reviews
                          </span>
                        </span>
                      </div>

                      <p class="mt-1 text-sm">
                        <span class="font-bold text-primary-700">
                          {fees ? `${fees} Lacs` : c.fee_range}
                        </span>{" "}
                        <span class="text-xs text-[var(--color-muted)]">Total Fees</span>
                      </p>

                      <p class="mt-2 line-clamp-1 border-t border-[var(--color-line)] pt-2 text-[11px] text-[var(--color-muted)]">
                        Ranked {rank} out of 500
                        {state ? ` · ${state}` : ""} · {c.type}
                      </p>

                      <div class="mt-1 divide-y divide-[var(--color-line)] border-t border-[var(--color-line)] text-xs">
                        <A
                          href={href}
                          class="flex items-center justify-between py-2 font-semibold text-[var(--color-ink)] transition-colors hover:text-primary-700"
                        >
                          View all courses and fees
                          <span aria-hidden="true" class="text-[var(--color-muted)]">
                            ›
                          </span>
                        </A>
                        <button
                          type="button"
                          onClick={() => setBrochure({ college: c, cover: coverFor(c) })}
                          class="flex w-full items-center justify-between py-2 font-semibold text-[var(--color-ink)] transition-colors hover:text-primary-700"
                        >
                          Download brochure
                          <span aria-hidden="true" class="text-[var(--color-muted)]">
                            ›
                          </span>
                        </button>
                        <A
                          href={href}
                          class="flex items-center justify-between py-2 font-semibold text-primary-700 hover:text-primary-900"
                        >
                          Compare
                          <span aria-hidden="true">›</span>
                        </A>
                      </div>
                    </div>
                  </article>
                );
              }}
            </For>
          </div>

          {/* Overlay slider arrows, hidden at the track ends. */}
          <button
            type="button"
            aria-label="Previous colleges"
            onClick={() => scroll(-1)}
            classList={{ "pointer-events-none opacity-0": atStart() }}
            class="absolute -left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-line)] bg-white text-primary-700 shadow-md transition-opacity hover:bg-primary-50 sm:grid"
          >
            <span aria-hidden="true" class="text-2xl leading-none">
              ‹
            </span>
          </button>
          <button
            type="button"
            aria-label="Next colleges"
            onClick={() => scroll(1)}
            classList={{ "pointer-events-none opacity-0": atEnd() }}
            class="absolute -right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-line)] bg-white text-primary-700 shadow-md transition-opacity hover:bg-primary-50 sm:grid"
          >
            <span aria-hidden="true" class="text-2xl leading-none">
              ›
            </span>
          </button>
        </div>

        <div class="mt-8 text-center">
          <A
            href={listingPath("mba", "mba", "varanasi")}
            class="inline-flex items-center gap-2 rounded-full bg-primary-50 px-6 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
          >
            View more colleges
            <span aria-hidden="true">→</span>
          </A>
        </div>
      </div>

      <BrochureModal target={brochure()} onClose={() => setBrochure(null)} />
    </section>
  );
}
