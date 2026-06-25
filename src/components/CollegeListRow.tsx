import { A } from "@solidjs/router";
import { For, Show, type JSX } from "solid-js";
import type { CollegeCard } from "~/lib/types";
import { track } from "~/lib/analytics";
import CollegeLogo from "./CollegeLogo";
import CompareToggle from "./CompareToggle";
import SaveButton from "./SaveButton";

/**
 * Horizontal list-row result card (listing page). Surfaces the data the listing
 * API provides per college (courses, fees, package, approvals, rating, NIRF) in
 * labelled columns. "Get info" is category-level guidance, never "apply" (compliance 2).
 */
function Stat(props: { label: string; children: JSX.Element }) {
  return (
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {props.label}
      </p>
      <p class="mt-0.5 truncate text-sm font-semibold text-[var(--color-ink)]">{props.children}</p>
    </div>
  );
}

export default function CollegeListRow(props: {
  college: CollegeCard;
  onGetInfo?: (c: CollegeCard) => void;
}) {
  const c = props.college;
  const href = `/college/${c.slug}-${c.id}`;
  const onCardClick = () => track("card_click", { college_id: c.id, college: c.name });

  return (
    <article class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-all hover:border-primary-200 hover:shadow-md hover:shadow-primary-900/5 sm:p-5">
      <div class="flex flex-col gap-4 sm:flex-row">
        {/* Main */}
        <div class="min-w-0 flex-1">
          <div class="flex items-start gap-3">
            <span class="shrink-0 rounded-lg border border-[var(--color-line)] bg-white p-1">
              <CollegeLogo
                name={c.name}
                logo={c.logo}
                id={c.id}
                class="h-12 w-12 rounded-md text-base"
              />
            </span>
            <div class="min-w-0 flex-1">
              {/* Badge stacks under the name on mobile (so a long ranking name
                  never hides the title) and sits to the right on sm+. */}
              <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                <h3 class="min-w-0 text-[15px] font-bold leading-snug text-[var(--color-ink)] sm:flex-1">
                  <A href={href} onClick={onCardClick} class="hover:text-primary-700 hover:underline">
                    {c.name}
                  </A>
                </h3>
                <Show when={c.nirf_rank}>
                  {(r) => (
                    <span class="inline-flex w-fit shrink-0 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-600">
                      {r().agency} #{r().rank}
                    </span>
                  )}
                </Show>
              </div>
              <p class="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {c.city} · {c.type}
              </p>
            </div>
          </div>

          {/* Data columns */}
          <div class="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[var(--color-line)] pt-3">
            <Stat label="Courses Offered">
              <span>{c.key_courses.length || 1}+ courses</span>
              <Show when={c.rating > 0}>
                <span class="ml-1.5 inline-flex items-center gap-0.5">
                  <span aria-hidden="true" class="text-[var(--color-warning)]">★</span>
                  <span>{c.rating.toFixed(1)}</span>
                </span>
              </Show>
            </Stat>
            <Show
              when={c.approvals.length}
              fallback={
                <Stat label="Top Courses">{c.key_courses.slice(0, 3).join(", ") || "—"}</Stat>
              }
            >
              <Stat label="Approvals">{c.approvals.join(", ")}</Stat>
            </Show>
            <Stat label="Total Tuition Fees">{c.fee_range || "On request"}</Stat>
            <Show when={c.highest_package}>
              <Stat label="Highest Package">{c.highest_package}</Stat>
            </Show>
          </div>

          <Show when={c.key_courses.length > 1}>
            <p class="mt-2 text-xs text-[var(--color-muted)]">
              Also offers {c.key_courses.slice(1, 5).join(", ")}
              {c.key_courses.length > 5 ? "…" : ""}
            </p>
          </Show>
        </div>

        {/* Actions */}
        <div class="flex shrink-0 flex-row gap-2 sm:w-36 sm:flex-col">
          <SaveButton collegeId={c.id} class="flex-1 sm:w-full" />
          <CompareToggle
            college={{ id: c.id, slug: c.slug, name: c.name, logo: c.logo, city: c.city, type: c.type }}
            class="flex-1 sm:w-full"
          />
          <Show
            when={props.onGetInfo}
            fallback={
              <A
                href={`${href}#contact`}
                class="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-accent-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-400 sm:w-full"
              >
                Get info
              </A>
            }
          >
            <button
              type="button"
              onClick={() => props.onGetInfo?.(c)}
              class="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-accent-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-400 sm:w-full"
            >
              Get info
            </button>
          </Show>
        </div>
      </div>
    </article>
  );
}
