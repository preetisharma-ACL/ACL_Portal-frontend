import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import type { CollegeCard } from "~/lib/types";
import { track } from "~/lib/analytics";
import { Badge } from "./ui";
import CollegeLogo from "./CollegeLogo";
import CompareToggle from "./CompareToggle";
import SaveButton from "./SaveButton";

/** Per-college neutral cover gradients, keyed by id so each card is distinct and
 *  stable (never one shared stock photo repeated across colleges). */
const COVER_GRADIENTS = [
  "from-primary-700 via-primary-800 to-primary-900",
  "from-[#0c3066] via-[#03204a] to-[#011838]",
  "from-[#1b2a4a] to-[#0a1832]",
  "from-accent-600 via-primary-800 to-primary-900",
  "from-[#3a2740] to-[#160f24]",
  "from-[#123a3f] to-[#08222a]",
];

/**
 * Image-led college result card used on listing, course and exam pages. The
 * "Get info" CTA is category-level guidance, never "apply to this college"
 * (compliance 2).
 */
export default function CollegeCardItem(props: {
  college: CollegeCard;
  onGetInfo?: (c: CollegeCard) => void;
}) {
  const c = props.college;
  const href = `/college/${c.slug}-${c.id}`;
  const grad = COVER_GRADIENTS[Math.abs(c.id) % COVER_GRADIENTS.length];
  const onCardClick = () => track("card_click", { college_id: c.id, college: c.name });

  return (
    <article class="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-900/5">
      {/* Cover: the college's own photo when available, else a per-college
          neutral gradient (distinct per college, never a shared stock image),
          with NIRF badge, rating pill and logo/name overlay. */}
      <div class="relative h-44 overflow-hidden">
        <Show
          when={c.hero_image}
          fallback={<div class={`absolute inset-0 bg-gradient-to-br ${grad}`} />}
        >
          <img
            src={c.hero_image!}
            alt=""
            loading="lazy"
            decoding="async"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Show>
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10"
        />

        <Show when={c.nirf_rank}>
          {(r) => (
            <span class="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-accent-500/95 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
              {r().agency} #{r().rank}
            </span>
          )}
        </Show>

        <Show when={c.rating > 0}>
          <span class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-bold text-primary-900 shadow-sm">
            <span aria-hidden="true" class="text-[var(--color-warning)]">
              ★
            </span>
            {c.rating.toFixed(1)}/5
          </span>
        </Show>

        <div class="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
          <span class="shrink-0 rounded-lg bg-white p-1.5 shadow-md ring-1 ring-black/5">
            <CollegeLogo
              name={c.name}
              logo={c.logo}
              id={c.id}
              class="h-11 w-11 rounded-md text-base"
            />
          </span>
          <div class="min-w-0">
            <h3 class="text-base font-bold leading-snug text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.55)] line-clamp-2">
              <A href={href} onClick={onCardClick} class="hover:underline">
                {c.name}
              </A>
            </h3>
            <p class="mt-0.5 flex items-center gap-1 truncate text-xs text-white/85">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3 w-3 shrink-0" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {c.city} · {c.type}
            </p>
          </div>
        </div>
      </div>

      {/* Body: featured course, stat strip, approvals, actions */}
      <div class="flex flex-1 flex-col gap-3 p-4">
        <p class="line-clamp-1 font-semibold leading-snug text-[var(--color-ink)]">
          {c.key_courses[0] ?? "Multiple courses"}
        </p>

        {/* Stat strip */}
        <div class="grid grid-cols-2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-canvas)]/60">
          <div class="border-r border-[var(--color-line)] px-3 py-2.5">
            <p class="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Total Fees
            </p>
            <p class="mt-0.5 text-sm font-bold text-primary-700">
              {c.fee_range || "On request"}
            </p>
          </div>
          <div class="px-3 py-2.5">
            <p class="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {c.highest_package ? "Highest Package" : "Courses"}
            </p>
            <p class="mt-0.5 text-sm font-bold text-[var(--color-ink)]">
              {c.highest_package || `${c.key_courses.length || 1}+ offered`}
            </p>
          </div>
        </div>

        <Show when={c.approvals.length}>
          <div class="flex flex-wrap gap-1.5">
            <For each={c.approvals}>{(a) => <Badge tone="success">{a}</Badge>}</For>
          </div>
        </Show>

        <Show when={c.key_courses.length > 1}>
          <p class="text-xs text-[var(--color-muted)]">
            Also offers {c.key_courses.slice(1, 4).join(", ")}
            {c.key_courses.length > 4 ? "…" : ""}
          </p>
        </Show>

        {/* Actions */}
        <div class="mt-auto space-y-2 pt-1">
          <A
            href={href}
            onClick={onCardClick}
            class="flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-primary-600 px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
          >
            View details and courses
            <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">›</span>
          </A>
          <Show
            when={props.onGetInfo}
            fallback={
              <A
                href={`${href}#contact`}
                class="flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Get info and guidance
              </A>
            }
          >
            <button
              type="button"
              onClick={() => props.onGetInfo?.(c)}
              class="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Get info and guidance
            </button>
          </Show>
          <div class="grid grid-cols-2 gap-2">
            <SaveButton collegeId={c.id} class="w-full" />
            <CompareToggle
              college={{ id: c.id, slug: c.slug, name: c.name, logo: c.logo, city: c.city, type: c.type }}
              class="w-full"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
