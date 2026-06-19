import { A, createAsync } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import StreamIcon from "~/components/StreamIcon";
import { streamQuery } from "~/lib/queries";
import type { Stream } from "~/lib/types";

const TAGLINES: Record<string, string> = {
  mba: "After Graduation",
  engineering: "After Class 12",
  medical: "After Class 12",
  law: "Integrated and PG",
  arts: "After Class 12",
  commerce: "After Class 12",
  science: "After Class 12",
  design: "Creative careers",
};

const GLYPHS = ["🎓", "📘", "📊", "💼", "🧪", "⚖️", "🎨", "🧠", "🌐", "🏛️", "📈", "🩺"];

/**
 * Browse by stream. Streams sit in a left rail; selecting one shows that
 * stream's courses as cards on the right. The selected stream's courses load
 * from the streamQuery (server-rendered for the default stream, then cached per
 * stream on the client) so the grid updates instantly without a full navigation.
 */
export default function StreamExplorer(props: { streams: Stream[] }) {
  const [active, setActive] = createSignal(props.streams[0]?.slug ?? "mba");
  const detail = createAsync(() => streamQuery(active()));

  const activeStream = () => props.streams.find((s) => s.slug === active());

  return (
    <div class="grid gap-6 lg:grid-cols-[16rem_1fr]">
      {/* Left rail: streams */}
      <div
        class="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
        role="tablist"
        aria-label="Streams"
      >
        <For each={props.streams}>
          {(s) => {
            const isActive = () => active() === s.slug;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={isActive()}
                onClick={() => setActive(s.slug)}
                class="shrink-0 lg:w-full text-left rounded-[var(--radius-lg)] border px-4 py-3 transition-colors"
                classList={{
                  "bg-primary-600 text-white border-primary-600 shadow-sm": isActive(),
                  "bg-[var(--color-surface)] border-[var(--color-line)] hover:border-primary-300 hover:bg-primary-50":
                    !isActive(),
                }}
              >
                <span class="flex items-center gap-3">
                  <StreamIcon slug={s.slug} class="text-2xl" />
                  <span class="min-w-0">
                    <span class="block font-semibold whitespace-nowrap">{s.name}</span>
                    <span
                      class="mt-0.5 inline-block text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                      classList={{
                        "bg-white/20 text-white": isActive(),
                        "bg-primary-50 text-primary-700": !isActive(),
                      }}
                    >
                      {TAGLINES[s.slug] ?? "Explore programmes"}
                    </span>
                  </span>
                </span>
              </button>
            );
          }}
        </For>
      </div>

      {/* Right: courses for the selected stream */}
      <div>
        <div class="flex items-baseline justify-between mb-4">
          <h3 class="text-lg font-bold">
            {activeStream()?.name} courses
          </h3>
          <A
            href={`/${active()}`}
            class="text-sm font-medium text-primary-700 hover:underline"
          >
            View all
          </A>
        </div>

        <Show
          when={detail()}
          fallback={
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              <For each={Array.from({ length: 8 })}>
                {() => (
                  <div class="h-56 rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-canvas)] animate-pulse" />
                )}
              </For>
            </div>
          }
        >
          {(d) => (
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              <For each={d().courses}>
                {(c, i) => {
                  const specs = 4 + ((i() * 7) % 36);
                  const popular = i() === 0;
                  return (
                    <A
                      href={`/${c.slug}-course`}
                      class="group relative flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
                    >
                      {/* Hover wash */}
                      <div
                        aria-hidden="true"
                        class="pointer-events-none absolute inset-x-0 -top-16 h-24 bg-gradient-to-b from-primary-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <span
                        class="relative self-start inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        classList={{
                          "bg-primary-50 text-primary-700": popular,
                          "bg-accent-400/15 text-accent-600": !popular,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          class="w-1.5 h-1.5 rounded-full"
                          classList={{
                            "bg-primary-500": popular,
                            "bg-accent-500": !popular,
                          }}
                        />
                        {popular ? "Popular" : `${specs}+ specialisations`}
                      </span>

                      <div class="relative my-3 mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-2xl ring-1 ring-primary-100 transition-transform duration-200 group-hover:scale-105">
                        <span aria-hidden="true">{GLYPHS[i() % GLYPHS.length]}</span>
                      </div>

                      <h4 class="relative text-center text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] flex items-center justify-center group-hover:text-primary-700">
                        {c.name}
                      </h4>

                      <div class="relative mt-1.5 flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-muted)]">
                        <Show when={c.duration}>
                          <span class="whitespace-nowrap">{c.duration}</span>
                        </Show>
                        <Show when={c.duration && c.fee_range}>
                          <span aria-hidden="true">·</span>
                        </Show>
                        <Show when={c.fee_range}>
                          <span class="truncate">{c.fee_range}</span>
                        </Show>
                      </div>

                      <span class="relative mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 group-hover:bg-primary-600 group-hover:text-white rounded-[var(--radius-md)] py-2 transition-colors">
                        View course
                        <span
                          aria-hidden="true"
                          class="transition-transform duration-200 group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </span>
                    </A>
                  );
                }}
              </For>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}
