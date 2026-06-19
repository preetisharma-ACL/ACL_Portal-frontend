import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import type { CollegeCard } from "~/lib/types";

const PLACEHOLDER_LOGO = "/placeholders/college-logo.svg";

/**
 * Editorial ranked card for the home "Top colleges" module. Deliberately
 * restrained: a rank marker, logo, a quiet rating chip, a fees and courses
 * line, outline approval tags and a clear link. One warm accent (the star and
 * the hover rule) keeps it from feeling flat without over-decorating.
 */
export default function TopCollegeCard(props: { college: CollegeCard; rank: number }) {
  const c = props.college;
  const href = `/college/${c.slug}-${c.id}`;
  return (
    <A
      href={href}
      class="group relative flex items-stretch gap-4 sm:gap-5 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5 transition-colors hover:border-primary-300"
    >
      {/* Warm accent rule, shown on hover */}
      <span
        aria-hidden="true"
        class="absolute left-0 top-5 bottom-5 w-1 rounded-r-full bg-transparent transition-colors group-hover:bg-accent-500"
      />

      {/* Rank */}
      <div class="flex w-9 shrink-0 flex-col items-center justify-center border-r border-[var(--color-line)] pr-3 sm:pr-4">
        <span class="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Rank
        </span>
        <span class="text-2xl font-extrabold leading-none text-primary-700">{props.rank}</span>
      </div>

      <img
        src={c.logo || PLACEHOLDER_LOGO}
        alt={`${c.name} logo`}
        width="56"
        height="56"
        loading="lazy"
        decoding="async"
        onError={(e) => (e.currentTarget.src = PLACEHOLDER_LOGO)}
        class="w-14 h-14 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white object-contain"
      />

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-semibold leading-snug truncate group-hover:text-primary-700">
              {c.name}
            </h3>
            <p class="text-sm text-[var(--color-muted)]">
              {c.city} · {c.type}
            </p>
          </div>
          <Show when={c.rating > 0}>
            <span class="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-sm font-semibold text-primary-700">
              <span aria-hidden="true" class="text-[var(--color-warning)]">
                ★
              </span>
              {c.rating.toFixed(1)}
            </span>
          </Show>
        </div>

        <p class="mt-3 text-sm">
          <span class="text-[var(--color-muted)]">Fees </span>
          <span class="font-medium">{c.fee_range}</span>
        </p>
        <p class="mt-0.5 text-sm text-[var(--color-muted)] truncate">
          {c.key_courses.join(", ")}
        </p>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap gap-1.5">
            <For each={c.approvals.slice(0, 3)}>
              {(a) => (
                <span class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
                  {a}
                </span>
              )}
            </For>
          </div>
          <span class="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
            View details
            <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </div>
    </A>
  );
}
