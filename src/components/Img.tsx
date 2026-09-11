import { For, Show, mergeProps } from "solid-js";
import { bundled, cdnSrcSet, cdnUrl } from "~/lib/image";

/**
 * The one image element every card, listing and detail page renders through.
 *
 * It exists so that three things are impossible to forget:
 *  - a `srcset`/`sizes` pair matching the box the image actually occupies, so a
 *    501px card never pulls a 5472px original;
 *  - `width`/`height` (or an explicit aspect ratio), so the box is reserved
 *    before the bytes arrive and nothing below it shifts;
 *  - `loading`/`fetchpriority` chosen per position, rather than `lazy`
 *    everywhere — a lazy above-the-fold image delays the LCP it *is*.
 *
 * Bundled /public assets resolve to their pre-encoded AVIF/WebP/JPEG variants
 * from the build manifest and render as a <picture>. Remote Payload media goes
 * through the edge optimiser (which negotiates AVIF/WebP itself, so a single
 * <img> is enough). Anything unrecognised renders as a plain <img> with whatever
 * dimensions were passed — never worse than before this component existed.
 */
export default function Img(props: {
  /** Original path ("/varanasi.jpg") or an absolute remote media URL. */
  src: string;
  alt: string;
  /** CSS `sizes`. Required for anything that is not a fixed-pixel box. */
  sizes?: string;
  /**
   * Largest width the layout can display this image at, at 2x DPR. Caps the
   * remote srcset; ignored for bundled assets, whose widths are fixed at build
   * time.
   */
  maxWidth?: number;
  /** Intrinsic size, for the width/height attributes. Bundled assets know theirs. */
  width?: number;
  height?: number;
  /**
   * Above the fold. Sets loading="eager" + fetchpriority="high" instead of the
   * lazy default. Use only for images in the first viewport.
   */
  priority?: boolean;
  class?: string;
  /** Reactive class toggles, same shape Solid gives a plain <img>. */
  classList?: Record<string, boolean | undefined>;
  /** Applied to the <picture> wrapper when one is rendered. */
  wrapperClass?: string;
  onError?: (e: Event & { currentTarget: HTMLImageElement }) => void;
}) {
  // display:contents by default, so wrapping an <img> in a <picture> cannot
  // introduce a box of its own and shift the layout around it.
  const p = mergeProps({ sizes: "100vw", maxWidth: 1920, wrapperClass: "contents" }, props);

  const asset = () => bundled(p.src);
  const remoteSrcSet = () => cdnSrcSet(p.src, p.maxWidth);

  const width = () => p.width ?? asset()?.width;
  const height = () => p.height ?? asset()?.height;

  const loading = () => (p.priority ? "eager" : "lazy") as "eager" | "lazy";
  const fetchpriority = () => (p.priority ? "high" : "auto");

  return (
    <Show
      when={asset()}
      fallback={
        <img
          src={remoteSrcSet() ? cdnUrl(p.src, Math.min(p.maxWidth, 1920)) : p.src}
          srcset={remoteSrcSet()}
          sizes={remoteSrcSet() ? p.sizes : undefined}
          alt={p.alt}
          width={width()}
          height={height()}
          loading={loading()}
          fetchpriority={fetchpriority()}
          decoding="async"
          class={p.class}
          classList={p.classList}
          onError={p.onError}
        />
      }
    >
      {(a) => (
        <picture class={p.wrapperClass}>
          <For each={a().sources}>
            {(s) => <source type={s.type} srcset={s.srcset} sizes={p.sizes} />}
          </For>
          <img
            src={a().src}
            srcset={a().srcset}
            sizes={p.sizes}
            alt={p.alt}
            width={width()}
            height={height()}
            loading={loading()}
            fetchpriority={fetchpriority()}
            decoding="async"
            class={p.class}
            classList={p.classList}
            onError={p.onError}
          />
        </picture>
      )}
    </Show>
  );
}
