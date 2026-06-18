import { Show, type JSX, createEffect, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";

/** Accessible modal dialog. Renders nothing on the server until opened on the client. */
export default function Modal(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
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
      <div
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
      >
        <div
          class="absolute inset-0 bg-black/50"
          onClick={props.onClose}
          aria-hidden="true"
        />
        <div class="relative bg-[var(--color-surface)] w-full sm:max-w-lg rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] shadow-xl max-h-[92vh] overflow-y-auto">
          <div class="sticky top-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]">
            <h2 class="font-bold text-lg">{props.title}</h2>
            <button
              type="button"
              onClick={props.onClose}
              aria-label="Close"
              class="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-canvas)]"
            >
              <span aria-hidden="true" class="text-xl leading-none">
                ×
              </span>
            </button>
          </div>
          <div class="p-5">{props.children}</div>
        </div>
      </div>
    </Show>
  );
}
