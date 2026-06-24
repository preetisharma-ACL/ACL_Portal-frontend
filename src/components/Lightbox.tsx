import { Show, createEffect, onCleanup } from "solid-js";
import { Portal, isServer } from "solid-js/web";

export interface LightboxImage {
  url: string;
  caption?: string;
}

/**
 * Full-image lightbox. Portaled to <body> so it overlays everything; supports
 * prev/next (buttons + arrow keys) and Escape to close.
 */
export default function Lightbox(props: {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const count = () => props.images.length;
  const go = (delta: number) => {
    if (props.index === null || count() === 0) return;
    props.onIndex((props.index + delta + count()) % count());
  };

  createEffect(() => {
    if (isServer || props.index === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    });
  });

  const current = () => (props.index !== null ? props.images[props.index] : undefined);

  return (
    <Show when={props.index !== null && current()}>
      <Portal>
        <div
          class="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 animate-backdrop-in"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={props.onClose}
        >
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close"
            class="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <span aria-hidden="true" class="text-2xl leading-none">
              ×
            </span>
          </button>

          <Show when={count() > 1}>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              class="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
            >
              <span aria-hidden="true" class="text-3xl leading-none">
                ‹
              </span>
            </button>
          </Show>

          <figure class="max-h-[90vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={current()!.url}
              alt={current()!.caption ?? "College image"}
              class="mx-auto max-h-[84vh] max-w-[92vw] rounded-[var(--radius-md)] object-contain"
            />
            <figcaption class="mt-3 text-center text-sm text-white/80">
              <Show when={current()!.caption}>{current()!.caption}</Show>
              <Show when={count() > 1}>
                <span class="ml-2 text-white/50">
                  {props.index! + 1} / {count()}
                </span>
              </Show>
            </figcaption>
          </figure>

          <Show when={count() > 1}>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              class="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
            >
              <span aria-hidden="true" class="text-3xl leading-none">
                ›
              </span>
            </button>
          </Show>
        </div>
      </Portal>
    </Show>
  );
}
