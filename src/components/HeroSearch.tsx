import { useNavigate } from "@solidjs/router";
import { createResource, createSignal, For, Show, type JSX } from "solid-js";
import { searchAction } from "~/lib/actions";
import { track } from "~/lib/analytics";

type Scope = "all" | "colleges" | "courses" | "exams";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "colleges", label: "Colleges" },
  { value: "courses", label: "Courses" },
  { value: "exams", label: "Exams" },
];

const EMPTY = { colleges: [], courses: [], exams: [] };

/** Primary homepage search across colleges, courses and exams, with type-ahead. */
export default function HeroSearch() {
  const navigate = useNavigate();
  const [scope, setScope] = createSignal<Scope>("all");
  const [term, setTerm] = createSignal("");
  const [debounced, setDebounced] = createSignal("");
  const [open, setOpen] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Plain server action via createResource, decoupled from the router so typing
  // never triggers a route transition/reload. `.latest` reads without suspending.
  const [resource] = createResource(
    () => (debounced().trim().length >= 2 ? debounced().trim() : null),
    (q) => searchAction(q),
  );
  const suggestions = () => resource.latest ?? EMPTY;

  const inScope = (s: Scope) => scope() === "all" || scope() === s;
  const visibleCount = () => {
    const r = suggestions();
    if (!r) return 0;
    return (
      (inScope("colleges") ? r.colleges.length : 0) +
      (inScope("courses") ? r.courses.length : 0) +
      (inScope("exams") ? r.exams.length : 0)
    );
  };
  const hasSuggestions = () => visibleCount() > 0;

  function onInput(value: string) {
    setTerm(value);
    setOpen(true);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setDebounced(value), 200);
  }

  function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const q = term().trim();
    track("search", { search_term: q, scope: scope() });
    setOpen(false);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (scope() !== "all") params.set("type", scope());
    navigate(`/search?${params.toString()}`);
  }

  function go(href: string) {
    setOpen(false);
    navigate(href);
  }

  return (
    <div class="w-full max-w-2xl">
      <div class="flex gap-1 mb-2" role="tablist" aria-label="Search scope">
        <For each={SCOPES}>
          {(s) => (
            <button
              type="button"
              role="tab"
              aria-selected={scope() === s.value}
              onClick={() => setScope(s.value)}
              class="text-sm px-3 py-1.5 rounded-full transition-colors"
              classList={{
                "bg-white text-primary-700 font-semibold": scope() === s.value,
                "text-white/80 hover:text-white": scope() !== s.value,
              }}
            >
              {s.label}
            </button>
          )}
        </For>
      </div>

      <div class="relative">
        <form
          role="search"
          onSubmit={onSubmit}
          class="flex items-center gap-2 bg-white rounded-[var(--radius-lg)] p-1.5 shadow-lg"
        >
          <input
            name="q"
            type="search"
            autocomplete="off"
            value={term()}
            onInput={(e) => onInput(e.currentTarget.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Try MBA colleges in Varanasi, or CAT exam"
            aria-label="Search colleges, courses or exams"
            aria-expanded={open() && hasSuggestions()}
            class="flex-1 px-3 py-2.5 outline-none text-[var(--color-ink)] min-w-0"
          />
          <button
            type="submit"
            class="shrink-0 bg-accent-500 hover:bg-accent-400 text-white font-semibold px-5 py-2.5 rounded-[var(--radius-md)]"
          >
            Search
          </button>
        </form>

        <Show when={open() && hasSuggestions()}>
          <div class="absolute z-40 mt-2 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] text-left shadow-2xl max-h-[70vh] overflow-y-auto">
            <Show when={inScope("colleges")}>
              <Group label="Colleges" count={suggestions()!.colleges.length}>
                <For each={suggestions()!.colleges}>
                  {(c) => (
                    <Suggestion
                      onSelect={() => go(`/college/${c.slug}-${c.id}`)}
                      primary={c.name}
                      secondary={[c.city, c.type].filter(Boolean).join(" · ") || "College"}
                    />
                  )}
                </For>
              </Group>
            </Show>
            <Show when={inScope("courses")}>
              <Group label="Courses" count={suggestions()!.courses.length}>
                <For each={suggestions()!.courses}>
                  {(c) => (
                    <Suggestion
                      onSelect={() => go(`/${c.slug}-course`)}
                      primary={c.name}
                      secondary="Course"
                    />
                  )}
                </For>
              </Group>
            </Show>
            <Show when={inScope("exams")}>
              <Group label="Exams" count={suggestions()!.exams.length}>
                <For each={suggestions()!.exams}>
                  {(e) => (
                    <Suggestion
                      onSelect={() => go(`/mba/${e.slug}-exam`)}
                      primary={e.name}
                      secondary="Exam"
                    />
                  )}
                </For>
              </Group>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}

function Group(props: { label: string; count: number; children: JSX.Element }) {
  return (
    <Show when={props.count > 0}>
      <div>
        <p class="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {props.label}
        </p>
        {props.children}
      </div>
    </Show>
  );
}

function Suggestion(props: { onSelect: () => void; primary: string; secondary: string }) {
  return (
    <button
      type="button"
      // onMouseDown fires before the input's onBlur, so navigation is not cancelled.
      onMouseDown={(e) => {
        e.preventDefault();
        props.onSelect();
      }}
      class="block w-full text-left px-3 py-2 hover:bg-primary-50"
    >
      <span class="block text-sm font-medium text-[var(--color-ink)]">{props.primary}</span>
      <span class="block text-xs text-[var(--color-muted)]">{props.secondary}</span>
    </button>
  );
}
