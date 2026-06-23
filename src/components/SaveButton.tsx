import { createAsync, revalidate } from "@solidjs/router";
import { Show, createSignal } from "solid-js";
import { meQuery, savedQuery } from "~/lib/queries";
import { saveCollege, unsaveCollege } from "~/lib/account";
import { openLogin } from "~/lib/authUi";
import type { CollegeCard } from "~/lib/types";

/** Save/bookmark toggle. Logged-out clicks prompt login, then complete the save. */
export default function SaveButton(props: {
  collegeId: number;
  class?: string;
  variant?: "icon" | "button";
}) {
  const user = createAsync(() => meQuery());
  const saved = createAsync(() =>
    user() ? savedQuery() : Promise.resolve([] as CollegeCard[]),
  );
  const [busy, setBusy] = createSignal(false);

  const isSaved = () => (saved() ?? []).some((c) => c.id === props.collegeId);

  async function doSave() {
    setBusy(true);
    try {
      if (isSaved()) await unsaveCollege(props.collegeId);
      else await saveCollege(props.collegeId);
      await revalidate("saved");
    } finally {
      setBusy(false);
    }
  }

  function onClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user()) {
      openLogin(() => void doSave());
      return;
    }
    void doSave();
  }

  return (
    <button
      type="button"
      aria-pressed={isSaved()}
      disabled={busy()}
      onClick={onClick}
      title={isSaved() ? "Saved" : "Save college"}
      class={`inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-colors disabled:opacity-50 ${
        props.variant === "button" ? "px-4 py-2.5" : "px-3 py-1.5"
      } ${
        isSaved()
          ? "border-accent-500 bg-accent-500/10 text-accent-600"
          : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-primary-300 hover:text-primary-700"
      } ${props.class ?? ""}`}
    >
      <span aria-hidden="true">{isSaved() ? "♥" : "♡"}</span>
      <Show when={props.variant === "button"} fallback={<span>{isSaved() ? "Saved" : "Save"}</span>}>
        <span>{isSaved() ? "Saved" : "Save college"}</span>
      </Show>
    </button>
  );
}
