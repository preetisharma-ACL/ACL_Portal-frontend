import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { Link } from "@solidjs/meta";
import { bundled } from "~/lib/image";
import type { OptimizedImage } from "~/lib/generated/images";

const IMAGES = ["/bg-image.jpg", "/bg-image2.jpg", "/bg-image3.jpg"];
const INTERVAL_MS = 5000;

/** Pre-encoded responsive variants for each slide, from the build manifest. */
const SLIDES = IMAGES.map((src) => bundled(src)).filter(
  (a): a is OptimizedImage => a !== undefined,
);

/** The hero spans the viewport at every breakpoint. */
const SIZES = "100vw";

/**
 * Background image slider with a dissolve (crossfade) effect for the hero.
 *
 * The first slide is a real <img>, not a CSS background. As a background it was
 * invisible to the preload scanner, which is what made it arrive late enough to
 * be measured as a 48s LCP; as an <img> with fetchpriority=high (and a matching
 * <link rel=preload> emitted by HeroPreload) the browser starts it from the
 * initial document. `object-fit: cover; object-position: center` renders
 * pixel-identically to the `bg-cover bg-center` it replaces.
 *
 * Slides 2 and 3 stay off the critical path entirely: their <img> elements are
 * only mounted once the page is idle, so the first view fetches one image rather
 * than three. Rotation timing and the 1000ms crossfade are unchanged.
 *
 * Purely decorative, so hidden from assistive tech.
 */
export default function HeroSlider() {
  const [active, setActive] = createSignal(0);
  // Slides beyond the first are withheld from the initial render so they are not
  // discovered during the critical path. Server-render is always just slide 1.
  const [showRest, setShowRest] = createSignal(false);

  const first = SLIDES[0];

  onMount(() => {
    if (isServer || SLIDES.length < 2) return;

    // Mount the remaining slides once the main thread is free. The first
    // rotation is 5s away, so even the 2s timeout fallback lands well ahead of
    // it and the dissolve is never starved.
    const mountRest = () => setShowRest(true);
    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }).requestIdleCallback;
    const handle = idle ? idle(mountRest, { timeout: 2000 }) : setTimeout(mountRest, 1200);

    const timer = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    onCleanup(() => {
      clearInterval(timer);
      if (!idle) clearTimeout(handle as ReturnType<typeof setTimeout>);
    });
  });

  const slideClass =
    "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out motion-reduce:transition-none";

  return (
    <div
      class="absolute inset-0 z-0 overflow-hidden bg-neutral-900"
      aria-hidden="true"
      // Inline blurred 20px thumbnail of slide 1 (under 0.5 KB, no extra
      // request). It fills the hero for the few hundred ms before the real
      // frame decodes, so the crossfade never starts from flat black.
      style={
        first?.lqip
          ? {
              "background-image": `url('${first.lqip}')`,
              "background-size": "cover",
              "background-position": "center",
            }
          : undefined
      }
    >
      <Show when={first}>
        {(a) => (
          <picture class="contents">
            <For each={a().sources}>
              {(s) => <source type={s.type} srcset={s.srcset} sizes={SIZES} />}
            </For>
            <img
              src={a().src}
              srcset={a().srcset}
              sizes={SIZES}
              alt=""
              width={a().width}
              height={a().height}
              fetchpriority="high"
              loading="eager"
              decoding="async"
              class={slideClass}
              classList={{ "opacity-100": active() === 0, "opacity-0": active() !== 0 }}
            />
          </picture>
        )}
      </Show>

      <Show when={showRest()}>
        <For each={SLIDES.slice(1)}>
          {(a, i) => (
            <picture class="contents">
              <For each={a.sources}>
                {(s) => <source type={s.type} srcset={s.srcset} sizes={SIZES} />}
              </For>
              <img
                src={a.src}
                srcset={a.srcset}
                sizes={SIZES}
                alt=""
                width={a.width}
                height={a.height}
                loading="lazy"
                decoding="async"
                class={slideClass}
                classList={{
                  "opacity-100": active() === i() + 1,
                  "opacity-0": active() !== i() + 1,
                }}
              />
            </picture>
          )}
        </For>
      </Show>
    </div>
  );
}

/**
 * <link rel="preload"> for the hero's first frame, rendered into <head> through
 * MetaProvider so it is in the initial document the preload scanner reads.
 *
 * imagesrcset/imagesizes mirror the <picture> exactly, so the preload resolves
 * to the same candidate the renderer will pick — a mismatch would download the
 * image twice. Only the AVIF set is preloaded, and `type` makes a browser
 * without AVIF support skip the link entirely rather than fetch bytes it cannot
 * decode; it then discovers the WebP/JPEG source normally.
 *
 * Mount this on pages that actually render the hero, not site-wide.
 */
export function HeroPreload() {
  const avif = SLIDES[0]?.sources.find((s) => s.type === "image/avif");
  return (
    <Show when={avif}>
      {(s) => (
        <Link
          rel="preload"
          as="image"
          type="image/avif"
          imagesrcset={s().srcset}
          imagesizes={SIZES}
          fetchpriority="high"
        />
      )}
    </Show>
  );
}
