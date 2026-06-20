import { A } from "@solidjs/router";
import { For, createSignal, onMount } from "solid-js";
import type { CityLite } from "~/lib/types";
import { listingPath } from "~/lib/slug";

/** Dedicated city photos in /public, keyed by city slug. */
const CITY_IMAGES: Record<string, string> = {
  varanasi: "/varanasi.jpg",
  lucknow: "/lucknow.jpg",
  "delhi-ncr": "/delhi.jpg",
  noida: "/noida.jpg",
  bengaluru: "/banglore.jpg",
};
/** Fallback cover for any city without a dedicated photo. */
const FALLBACK_COVER = "/bg-image.jpg";
const cityImage = (slug: string) => CITY_IMAGES[slug] ?? FALLBACK_COVER;

/**
 * "Browse by city" as a manually-controlled carousel: a horizontal snap track
 * with left/right arrows (no auto-scroll). Each city is an image-led card.
 */
export default function CityCarousel(props: { cities: CityLite[] }) {
  let track: HTMLDivElement | undefined;
  const [atStart, setAtStart] = createSignal(true);
  const [atEnd, setAtEnd] = createSignal(false);

  const update = () => {
    if (!track) return;
    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  };

  const scroll = (dir: number) => {
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: "smooth" });
  };

  onMount(update);

  const ArrowBtn = (p: { dir: number; label: string; disabled: boolean }) => (
    <button
      type="button"
      aria-label={p.label}
      disabled={p.disabled}
      onClick={() => scroll(p.dir)}
      class="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-primary-700 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--color-surface)]"
    >
      <span aria-hidden="true" class="text-xl leading-none">
        {p.dir < 0 ? "‹" : "›"}
      </span>
    </button>
  );

  return (
    <section class="relative overflow-hidden py-14 md:py-16">
      <div class="container-x">
        <div class="mb-8 flex items-end justify-between gap-4">
          <div class="max-w-2xl">
            <span class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600">
              <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-primary-600" />
              Explore by location
            </span>
            <h2 class="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-primary-900">
              Browse by city
            </h2>
            <p class="mt-3 text-base text-[var(--color-muted)]">
              Discover top-ranked colleges across India's leading education hubs.
            </p>
          </div>
          <div class="hidden shrink-0 items-center gap-2 sm:flex">
            <ArrowBtn dir={-1} label="Previous cities" disabled={atStart()} />
            <ArrowBtn dir={1} label="Next cities" disabled={atEnd()} />
          </div>
        </div>

        {/* Snap track. Hidden scrollbar; arrows (and touch swipe) drive it. */}
        <div
          ref={track}
          onScroll={update}
          class="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <For each={props.cities}>
            {(city) => (
              <A
                href={listingPath("mba", "mba", city.slug)}
                class="flex w-[18rem] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)]"
              >
                <div class="relative h-40">
                  <img
                    src={cityImage(city.slug)}
                    alt={`${city.name} city`}
                    loading="lazy"
                    decoding="async"
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10"
                  />
                  <span class="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-1 text-xs font-bold text-primary-900 shadow-sm">
                    {city.college_count}+ colleges
                  </span>
                  <div class="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
                    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-primary-600 shadow-md ring-1 ring-black/5">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </span>
                    <div class="min-w-0">
                      <h3 class="line-clamp-1 text-lg font-bold text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]">
                        {city.name}
                      </h3>
                      <p class="truncate text-xs text-white/85">{city.state}</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-1 flex-col p-4">
                  <p class="text-sm">
                    <span class="font-bold text-primary-700">{city.college_count}+</span>{" "}
                    <span class="text-[var(--color-muted)]">colleges to explore</span>
                  </p>
                  <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
                    View colleges
                    <span aria-hidden="true">›</span>
                  </span>
                </div>
              </A>
            )}
          </For>
        </div>

        {/* Mobile arrows below the track (no header space on small screens). */}
        <div class="mt-5 flex items-center justify-center gap-3 sm:hidden">
          <ArrowBtn dir={-1} label="Previous cities" disabled={atStart()} />
          <ArrowBtn dir={1} label="Next cities" disabled={atEnd()} />
        </div>
      </div>
    </section>
  );
}
