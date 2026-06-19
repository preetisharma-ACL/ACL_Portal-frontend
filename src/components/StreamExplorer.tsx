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
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              <For each={Array.from({ length: 8 })}>
                {() => (
                  <div class="h-44 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-canvas)] animate-pulse" />
                )}
              </For>
            </div>
          }
        >
          {(d) => (
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              <For each={d().courses}>
                {(c, i) => {
                  const specs = 4 + ((i() * 7) % 36);
                  const popular = i() === 0;
                  return (
                    <A
                      href={`/${c.slug}-course`}
                      class="group relative flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 hover:border-primary-300 hover:shadow-md transition"
                    >
                      <span
                        class="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        classList={{
                          "bg-primary-50 text-primary-700": popular,
                          "bg-accent-400/15 text-accent-600": !popular,
                        }}
                      >
                        {popular ? "Popular" : `${specs}+ specialisations`}
                      </span>
                      <div class="my-3 mx-auto grid place-items-center w-12 h-12 rounded-full bg-primary-50 text-2xl">
                        <span aria-hidden="true">{GLYPHS[i() % GLYPHS.length]}</span>
                      </div>
                      <h4 class="text-center text-sm font-semibold leading-snug min-h-[2.5rem] flex items-center justify-center">
                        {c.name}
                      </h4>
                      <span class="mt-3 block text-center text-xs font-semibold text-white bg-primary-600 group-hover:bg-primary-700 rounded-[var(--radius-md)] py-2 transition-colors">
                        View course
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
