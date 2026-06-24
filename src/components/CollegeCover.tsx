import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import HeroSlider from "./HeroSlider";
import type { MediaItem } from "~/lib/types";

const INTERVAL_MS = 5000;

/**
 * College hero cover. Crossfades through the college's own images (HERO first,
 * then gallery), auto-advancing when there is more than one. Falls back to the
 * bundled neutral slider when the college has no images; a single image renders
 * static (no auto-advance). The first image is server-rendered so the hero never
 * flashes empty.
 */
export default function CollegeCover(props: { media: MediaItem[]; name: string }) {
  // HERO image(s) first, then gallery/other, each group by `order`.
  const images = () => {
    const imgs = props.media.filter((m) => m.type === "image" && m.url);
    return [...imgs].sort((a, b) => {
      const ah = a.category === "HERO" ? 0 : 1;
      const bh = b.category === "HERO" ? 0 : 1;
      if (ah !== bh) return ah - bh;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  };

  const [active, setActive] = createSignal(0);

  onMount(() => {
    if (isServer) return;
    const list = images();
    if (list.length < 2) return;
    list.slice(1).forEach((m) => {
      const img = new Image();
      img.src = m.url;
    });
    const timer = setInterval(() => setActive((i) => (i + 1) % images().length), INTERVAL_MS);
    onCleanup(() => clearInterval(timer));
  });

  return (
    <Show when={images().length} fallback={<HeroSlider />}>
      <div class="absolute inset-0 z-0 overflow-hidden bg-neutral-900">
        <For each={images()}>
          {(m, i) => (
            <img
              src={m.url}
              alt={m.caption || `${props.name} campus`}
              decoding="async"
              loading={i() === 0 ? "eager" : "lazy"}
              onError={(e) => (e.currentTarget.style.display = "none")}
              class="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out motion-reduce:transition-none"
              classList={{ "opacity-100": active() === i(), "opacity-0": active() !== i() }}
            />
          )}
        </For>
        {/* Slide dots when more than one image */}
        <Show when={images().length > 1}>
          <div class="absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5">
            <For each={images()}>
              {(_, i) => (
                <button
                  type="button"
                  aria-label={`Show image ${i() + 1}`}
                  onClick={() => setActive(i())}
                  class="h-1.5 rounded-full transition-all"
                  classList={{
                    "w-5 bg-white": active() === i(),
                    "w-1.5 bg-white/60 hover:bg-white/90": active() !== i(),
                  }}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
