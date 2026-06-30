import { createAsync, revalidate } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { meQuery, trackingQuery } from "~/lib/queries";
import { setTracking } from "~/lib/account";
import { openLogin, TRACKING_LABELS, TRACKING_STATUSES } from "~/lib/authUi";
import type { CollegeInterest, TrackingStatus } from "~/lib/types";

/**
 * Personal interest tracker control for the college detail page. Sets the user's
 * status for this college (interested / inquired / applied / admitted). This is a
 * personal tracker, not a real application portal.
 */
export default function TrackStatus(props: { collegeId: number }) {
  const user = createAsync(() => meQuery());
  const tracking = createAsync(() =>
    user() ? trackingQuery() : Promise.resolve([] as CollegeInterest[]),
  );
  const [busy, setBusy] = createSignal(false);

  const current = () => (tracking() ?? []).find((t) => t.college_id === props.collegeId);

  async function apply(status: TrackingStatus) {
    setBusy(true);
    try {
      await setTracking({ college_id: props.collegeId, status });
      await revalidate("tracking");
    } finally {
      setBusy(false);
    }
  }

  function choose(status: TrackingStatus) {
    if (!user()) {
      openLogin(() => void apply(status));
      return;
    }
    void apply(status);
  }

  return (
    <div>
      <div class="flex flex-col items-center text-center">
        <div class="flex h-32 w-full items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-b from-primary-50 to-transparent">
          <img
            src="/Study%20Abroad.svg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={(e) => (e.currentTarget.style.display = "none")}
            class="h-28 w-auto object-contain"
          />
        </div>
        <p class="mt-3 text-base font-semibold">Track your interest</p>
        <p class="mt-1 text-xs text-[var(--color-muted)]">
          A personal tracker to organise your shortlist. Not an application.
        </p>
      </div>
      <div class="mt-4 flex flex-wrap justify-center gap-2">
        <For each={TRACKING_STATUSES}>
          {(s) => {
            const active = () => current()?.status === s;
            return (
              <button
                type="button"
                disabled={busy()}
                aria-pressed={active()}
                onClick={() => choose(s)}
                class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                classList={{
                  "border-primary-600 bg-primary-600 text-white": active(),
                  "border-[var(--color-line)] hover:border-primary-300 hover:text-primary-700":
                    !active(),
                }}
              >
                {TRACKING_LABELS[s]}
              </button>
            );
          }}
        </For>
      </div>
      <Show when={current()}>
        <p class="mt-3 text-center text-xs text-[var(--color-muted)]">
          Saved to your{" "}
          <a href="/account#tracker" class="text-primary-700 hover:underline">
            application tracker
          </a>
          .
        </p>
      </Show>
    </div>
  );
}
