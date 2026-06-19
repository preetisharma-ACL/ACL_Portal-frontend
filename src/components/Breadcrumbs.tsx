import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import type { Crumb } from "~/lib/jsonld";

/** Visible breadcrumb trail. Pair with breadcrumbLd() for the matching schema.
 *  Set `light` for use on dark/photo backgrounds. */
export default function Breadcrumbs(props: { crumbs: Crumb[]; light?: boolean }) {
  return (
    <nav
      aria-label="Breadcrumb"
      class="text-sm"
      classList={{
        "text-[var(--color-muted)]": !props.light,
        "text-white/75": props.light,
      }}
    >
      <ol class="flex flex-wrap items-center gap-1.5">
        <For each={props.crumbs}>
          {(c, i) => (
            <li class="flex items-center gap-1.5">
              <Show
                when={i() < props.crumbs.length - 1}
                fallback={
                  <span
                    class="font-medium"
                    classList={{
                      "text-[var(--color-ink)]": !props.light,
                      "text-white": props.light,
                    }}
                    aria-current="page"
                  >
                    {c.name}
                  </span>
                }
              >
                <A
                  href={c.path}
                  class="hover:underline"
                  classList={{
                    "hover:text-primary-600": !props.light,
                    "hover:text-white": props.light,
                  }}
                >
                  {c.name}
                </A>
                <span
                  aria-hidden="true"
                  classList={{
                    "text-[var(--color-line)]": !props.light,
                    "text-white/40": props.light,
                  }}
                >
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
