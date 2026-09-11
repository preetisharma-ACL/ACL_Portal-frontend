import { createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { siteImagesQuery } from "~/lib/queries";
import Img from "./Img";

/**
 * Renders a backend-managed site-image slot as an absolute cover image, with a
 * graceful fallback:
 *  - if the slot has an uploaded image, render it (admin uploads reflect live,
 *    no redeploy);
 *  - else if a bundled `fallback` is given, render that;
 *  - else render nothing (the page's existing default treatment shows through).
 *
 * `slot` may be a list of candidate keys (first present wins). `overlay` adds a
 * dark scrim for text contrast (use on gradient headers replaced by a photo).
 */
export default function SlotImage(props: {
  slot: string | string[];
  fallback?: string;
  alt?: string;
  overlay?: boolean;
  class?: string;
  /**
   * The slot sits in the first viewport. Slot images are full-bleed section
   * banners, so where one is above the fold it is usually the LCP element —
   * `loading="lazy"` on it would delay the very thing being measured.
   */
  priority?: boolean;
  /** CSS `sizes`. Banners are full-bleed, hence the default. */
  sizes?: string;
}) {
  const images = createAsync(() => siteImagesQuery());
  const match = () => {
    const map = images() ?? {};
    const keys = Array.isArray(props.slot) ? props.slot : [props.slot];
    for (const k of keys) if (map[k]?.image_url) return map[k];
    return null;
  };
  const url = () => match()?.image_url ?? props.fallback;

  return (
    <Show when={url()}>
      <Img
        src={url()!}
        alt={match()?.alt ?? props.alt ?? ""}
        sizes={props.sizes ?? "100vw"}
        maxWidth={1920}
        priority={props.priority}
        class={props.class ?? "absolute inset-0 z-0 h-full w-full object-cover"}
      />
      <Show when={props.overlay}>
        <div aria-hidden="true" class="absolute inset-0 z-0 bg-black/45" />
      </Show>
    </Show>
  );
}
