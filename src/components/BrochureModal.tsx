import { Show, Suspense, createEffect, onCleanup } from "solid-js";
import { Portal, isServer } from "solid-js/web";
import type { CollegeCard } from "~/lib/types";
import LeadForm from "./LeadForm";
import CollegeLogo from "./CollegeLogo";

export interface BrochureTarget {
  college: CollegeCard;
  cover: string;
}

/**
 * Professional "Download brochure" dialog: a campus photo on the left and the
 * (compliant, OTP-gated) lead form on the right. The brochure is delivered as
 * category-level guidance, never an application to a specific college.
 */
export default function BrochureModal(props: {
  target: BrochureTarget | null;
  onClose: () => void;
}) {
  createEffect(() => {
    if (isServer) return;
    if (props.target) {
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
    <Show when={props.target}>
      {(t) => (
        <Portal>
        <div
          class="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Download brochure for ${t().college.name}`}
        >
          <div class="absolute inset-0 bg-black/55" onClick={props.onClose} aria-hidden="true" />

          <div class="relative grid max-h-[90vh] w-full overflow-hidden rounded-t-[var(--radius-xl)] bg-[var(--color-surface)] shadow-2xl sm:max-w-4xl sm:rounded-[var(--radius-xl)] md:grid-cols-5">
            <button
              type="button"
              onClick={props.onClose}
              aria-label="Close"
              class="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[var(--color-ink)] shadow-sm transition-colors hover:bg-white"
            >
              <span aria-hidden="true" class="text-xl leading-none">
                ×
              </span>
            </button>

            {/* Left: campus photo + college identity (hidden on small screens) */}
            <div class="relative hidden md:col-span-2 md:block">
              <img src={t().cover} alt="" class="absolute inset-0 h-full w-full object-cover" />
              <div
                aria-hidden="true"
                class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25"
              />
              <div class="absolute inset-x-0 bottom-0 p-6">
                <span class="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/10">
                  <CollegeLogo
                    name={t().college.name}
                    logo={t().college.logo}
                    id={t().college.id}
                    class="h-11 w-11 rounded-lg text-xs"
                  />
                </span>
                <h3 class="mt-3 text-xl font-bold leading-tight text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
                  {t().college.name}
                </h3>
                <p class="mt-1 text-sm text-white/85">
                  {t().college.city} · {t().college.type}
                </p>
                <ul class="mt-4 space-y-1.5 text-sm text-white/90">
                  <li class="flex items-center gap-2">
                    <span aria-hidden="true" class="text-[var(--color-success)]">
                      ✓
                    </span>
                    Courses, fees and eligibility
                  </li>
                  <li class="flex items-center gap-2">
                    <span aria-hidden="true" class="text-[var(--color-success)]">
                      ✓
                    </span>
                    Placements and admission process
                  </li>
                  <li class="flex items-center gap-2">
                    <span aria-hidden="true" class="text-[var(--color-success)]">
                      ✓
                    </span>
                    Free guidance from our advisors
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: the lead form */}
            <div class="max-h-[90vh] overflow-y-auto p-5 md:col-span-3">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                Free brochure
              </span>
              <h3 class="mt-2 text-lg font-bold">Download the brochure</h3>
              <p class="mt-1 text-sm text-[var(--color-muted)]">
                Get the latest brochure and free guidance for{" "}
                <span class="font-semibold text-[var(--color-ink)]">{t().college.name}</span>.
              </p>

              <div class="mt-3">
                <Suspense
                  fallback={
                    <div class="py-10 text-center text-sm text-[var(--color-muted)]">Loading…</div>
                  }
                >
                  <LeadForm
                    sourcePage={`/college/${t().college.slug}-${t().college.id}#brochure`}
                    courseInterest={t().college.key_courses[0]}
                    defaultCity={t().college.city}
                    hideHeading
                    submitVariant="primary"
                    dense
                    onSuccess={() => {}}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </Show>
  );
}
