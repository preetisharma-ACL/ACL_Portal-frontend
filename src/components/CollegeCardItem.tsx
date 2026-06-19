import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import type { CollegeCard } from "~/lib/types";
import { track } from "~/lib/analytics";
import { Badge, LinkButton, Rating } from "./ui";
import CollegeLogo from "./CollegeLogo";

/**
 * College result card used on listing, course and exam pages. The "Get info"
 * CTA is category-level guidance, never "apply to this college" (compliance 2).
 */
export default function CollegeCardItem(props: {
  college: CollegeCard;
  onGetInfo?: (c: CollegeCard) => void;
}) {
  const c = props.college;
  const href = `/college/${c.slug}-${c.id}`;
  const onCardClick = () => track("card_click", { college_id: c.id, college: c.name });
  return (
    <article class="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
      <CollegeLogo
        name={c.name}
        logo={c.logo}
        id={c.id}
        class="w-16 h-16 text-xl rounded-[var(--radius-md)] shrink-0"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-semibold text-lg leading-snug break-words">
              <A href={href} onClick={onCardClick} class="hover:text-primary-700 hover:underline">
                {c.name}
              </A>
            </h3>
            <p class="text-sm text-[var(--color-muted)] break-words">
              {c.city} · {c.type}
            </p>
          </div>
          <Show when={c.rating > 0}>
            <span class="shrink-0">
              <Rating value={c.rating} />
            </span>
          </Show>
        </div>

        <div class="mt-2 flex flex-wrap gap-1.5">
          <For each={c.approvals}>{(a) => <Badge tone="success">{a}</Badge>}</For>
        </div>

        <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <dt class="text-[var(--color-muted)]">Key courses</dt>
            <dd class="font-medium">{c.key_courses.join(", ")}</dd>
          </div>
          <div>
            <dt class="text-[var(--color-muted)]">Fee range</dt>
            <dd class="font-medium">{c.fee_range}</dd>
          </div>
        </dl>

        <div class="mt-4 flex flex-wrap gap-2">
          <LinkButton href={href} variant="outline" size="sm">
            View details
          </LinkButton>
          <Show
            when={props.onGetInfo}
            fallback={
              <LinkButton href={`${href}#contact`} variant="accent" size="sm">
                Get info
              </LinkButton>
            }
          >
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] transition-colors text-sm px-3 py-1.5 bg-accent-500 text-[var(--color-ink)] hover:bg-accent-400"
              onClick={() => props.onGetInfo?.(c)}
            >
              Get info
            </button>
          </Show>
        </div>
      </div>
    </article>
  );
}
