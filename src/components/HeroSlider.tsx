import { For, createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";

const IMAGES = ["/bg-image.jpg", "/bg-image2.jpg", "/bg-image3.jpg"];
const INTERVAL_MS = 5000;

/**
 * Background image slider with a dissolve (crossfade) effect for the hero.
 * All images are stacked and server-rendered with the first one visible, so the
 * hero never flashes empty; on the client an interval crossfades between them by
 * animating opacity. Purely decorative, so hidden from assistive tech.
 */
export default function HeroSlider() {
  const [active, setActive] = createSignal(0);

  onMount(() => {
    if (isServer || IMAGES.length < 2) return;
    // Warm the next images so the first dissolve does not flash.
    IMAGES.slice(1).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const timer = setInterval(
      () => setActive((i) => (i + 1) % IMAGES.length),
      INTERVAL_MS,
    );
    onCleanup(() => clearInterval(timer));
  });

  return (
    <div class="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <For each={IMAGES}>
        {(src, i) => (
          <div
            class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out motion-reduce:transition-none"
            classList={{ "opacity-100": active() === i(), "opacity-0": active() !== i() }}
            style={{ "background-image": `url('${src}')` }}
          />
        )}
      </For>
    </div>
  );
}
