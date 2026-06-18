import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import type { Crumb } from "~/lib/jsonld";

/** Visible breadcrumb trail. Pair with breadcrumbLd() for the matching schema. */
export default function Breadcrumbs(props: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" class="text-sm text-[var(--color-muted)]">
      <ol class="flex flex-wrap items-center gap-1.5">
        <For each={props.crumbs}>
          {(c, i) => (
            <li class="flex items-center gap-1.5">
              <Show
                when={i() < props.crumbs.length - 1}
                fallback={
                  <span class="font-medium text-[var(--color-ink)]" aria-current="page">
                    {c.name}
                  </span>
                }
              >
                <A href={c.path} class="hover:text-primary-600 hover:underline">
                  {c.name}
                </A>
                <span aria-hidden="true" class="text-[var(--color-line)]">
                  /
                </span>
              </Show>
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
}
