import { A } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import StreamIcon from "~/components/StreamIcon";
import type { CourseLite, Stream } from "~/lib/types";

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

/**
 * Browse by stream. Streams sit in a left rail; selecting one shows that
 * stream's courses on the right. All streams' courses are preloaded (passed in
 * via coursesByStream), so switching is instant on the client, with no server
 * round-trip or skeleton flicker, plus a subtle fade on each switch.
 */
export default function StreamExplorer(props: {
  streams: Stream[];
  coursesByStream: Record<string, CourseLite[]>;
}) {
  const [active, setActive] = createSignal(props.streams[0]?.slug ?? "mba");
  const courses = () => props.coursesByStream[active()] ?? [];
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
                class="shrink-0 lg:w-full text-left rounded-[var(--radius-md)] border px-4 py-3 transition-colors"
                classList={{
                  "bg-primary-600 text-white border-primary-600 shadow-sm": isActive(),
                  "bg-[var(--color-surface)] border-[var(--color-line)] hover:border-primary-300 hover:bg-primary-50":
                    !isActive(),
                }}
              >
                <span class="flex items-center gap-3">
                  <StreamIcon
                    slug={s.slug}
                    class={`w-6 h-6 shrink-0 ${isActive() ? "text-white" : "text-accent-500"}`}
                  />
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

        {/* keyed on the active stream so the grid re-mounts and fades on switch */}
        <Show when={active()} keyed>
          {(_active) => (
            <div class="animate-fade grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              <For each={courses()}>
                {(c, i) => {
                  const specs = 4 + ((i() * 7) % 36);
                  const popular = i() === 0;
                  return (
                    <A
                      href={`/${c.slug}-course`}
                      class="group relative flex flex-col rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-accent-400 hover:shadow-md transition"
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
                      <div class="my-3 mx-auto grid place-items-center w-12 h-12 rounded-full bg-accent-400 text-white">
                        <StreamIcon slug={active()} class="w-6 h-6" />
                      </div>
                      <h4 class="text-center text-sm font-semibold leading-snug min-h-[2.5rem] flex items-center justify-center">
                        {c.name}
                      </h4>
                      <span class="mt-2 inline-flex items-center justify-center gap-1 text-xs font-semibold text-accent-500 group-hover:text-accent-600 transition-colors">
                        View course
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          width="14"
                          height="14"
                          aria-hidden="true"
                          class="transition-transform group-hover:translate-x-0.5"
                          innerHTML='<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'
                        />
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
