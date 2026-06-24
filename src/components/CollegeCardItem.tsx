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
    <article class="group flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)]">
      {/* Cover: the college's own photo when available, else a per-college
          neutral gradient (distinct per college, never a shared stock image),
          with rating pill and logo/name overlay. */}
      <div class="relative h-40">
        <Show
          when={c.hero_image}
          fallback={<div class={`absolute inset-0 bg-gradient-to-br ${grad}`} />}
        >
          <img
            src={c.hero_image!}
            alt=""
            loading="lazy"
            decoding="async"
            class="absolute inset-0 h-full w-full object-cover"
          />
        </Show>
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
        />

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
            <p class="mt-0.5 truncate text-xs text-white/85">
              {c.city} · {c.type}
            </p>
          </div>
        </div>
      </div>

      {/* Body: featured course, fees, approvals */}
      <div class="flex flex-1 flex-col p-4">
        <p class="line-clamp-1 font-semibold leading-snug text-[var(--color-ink)]">
          {c.key_courses[0]}
        </p>
        <p class="mt-1 text-sm">
          <Show
            when={c.fee_range}
            fallback={<span class="font-bold text-primary-700">Fees on request</span>}
          >
            <span class="font-bold text-primary-700">{c.fee_range}</span>{" "}
            <span class="text-[var(--color-muted)]">Total Fees</span>
          </Show>
        </p>

        <Show when={c.approvals.length}>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <For each={c.approvals}>{(a) => <Badge tone="success">{a}</Badge>}</For>
          </div>
        </Show>

        <Show when={c.key_courses.length > 1}>
          <p class="mt-3 text-xs text-[var(--color-muted)]">
            Also offers {c.key_courses.slice(1).join(", ")}
          </p>
        </Show>

        {/* Stacked action rows, like a professional comparison card */}
        <div class="mt-4 divide-y divide-[var(--color-line)] border-t border-[var(--color-line)]">
          <A
            href={href}
            onClick={onCardClick}
            class="flex items-center justify-between py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:text-primary-700"
          >
            View details and courses
            <span aria-hidden="true" class="text-[var(--color-muted)]">
              ›
            </span>
          </A>
          <Show
            when={props.onGetInfo}
            fallback={
              <A
                href={`${href}#contact`}
                class="flex items-center justify-between py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-900"
              >
                Get info and guidance
                <span aria-hidden="true">›</span>
              </A>
            }
          >
            <button
              type="button"
              onClick={() => props.onGetInfo?.(c)}
              class="flex w-full items-center justify-between py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-900"
            >
              Get info and guidance
              <span aria-hidden="true">›</span>
            </button>
          </Show>
        </div>

        {/* Save + add to compare */}
        <div class="mt-3 grid grid-cols-2 gap-2">
          <SaveButton collegeId={c.id} class="w-full" />
          <CompareToggle
            college={{ id: c.id, slug: c.slug, name: c.name, logo: c.logo, city: c.city, type: c.type }}
            class="w-full"
          />
        </div>
      </div>
    </article>
  );
}
