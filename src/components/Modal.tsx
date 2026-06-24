import { Show, Suspense, type JSX, createEffect, onCleanup } from "solid-js";
import { Portal, isServer } from "solid-js/web";

/** Accessible modal dialog. Renders nothing on the server until opened on the client. */
export default function Modal(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  /** Hide the default title bar so the body can supply its own header.
      A floating close button is rendered instead. */
  hideHeader?: boolean;
}) {
  createEffect(() => {
    if (isServer) return;
    if (props.open) {
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") props.onClose();
      };
      window.addEventListener("keydown", onKey);
      onCleanup(() => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      });
    }
  });

  return (
    <Show when={props.open}>
      {/* Portal to <body> so the modal escapes any ancestor stacking context /
          overflow / transform (e.g. the homepage hero's z-index) and always
          layers above the page. */}
      <Portal>
      <div
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in"
          onClick={props.onClose}
          aria-hidden="true"
        />
        <div class="relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[var(--radius-xl)] bg-[var(--color-surface)] shadow-2xl ring-1 ring-black/5 animate-modal-in sm:max-w-lg sm:rounded-[var(--radius-xl)]">
          <Show
            when={!props.hideHeader}
            fallback={
              <button
                type="button"
                onClick={props.onClose}
                aria-label="Close"
                class="absolute right-3 top-3 z-20 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-surface)]/80 text-[var(--color-muted)] backdrop-blur transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-5 w-5" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            }
          >
            {/* Header: brand accent bar + title + close */}
            <div class="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur">
              <div class="h-1 w-full bg-gradient-to-r from-primary-600 via-accent-500 to-primary-700" />
              <div class="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
                <h2 class="text-lg font-extrabold tracking-tight text-[var(--color-ink)]">
                  {props.title}
                </h2>
                <button
                  type="button"
                  onClick={props.onClose}
                  aria-label="Close"
                  class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-5 w-5" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </Show>
          <div class={props.hideHeader ? "overflow-y-auto" : "overflow-y-auto px-5 py-5 sm:px-6"}>
            {/* Contain any data suspension (e.g. the lead form's city/course
                dropdowns) to the modal, so it never triggers the app-level
                "Loading page" fallback (which looked like a full reload). */}
            <Suspense
              fallback={
                <div class="py-12 text-center text-sm text-[var(--color-muted)]">Loading…</div>
              }
            >
              {props.children}
            </Suspense>
          </div>
        </div>
      </div>
      </Portal>
    </Show>
  );
}
