import { useNavigate } from "@solidjs/router";
import { For, Show, createResource, createSignal, type JSX } from "solid-js";
import { searchAction } from "~/lib/actions";
import { track } from "~/lib/analytics";

const EMPTY = { colleges: [], courses: [], exams: [] };

/**
 * Type-ahead search across colleges, courses and exams. Suggestions are fetched
 * (debounced) from the search server function as the user types. The whole
 * control is a GET form to /search, so with JavaScript disabled it still submits
 * and the server renders results: progressive enhancement, not a hard JS gate.
 */
export default function SearchAutocomplete(props: {
  initial?: string;
  placeholder?: string;
  /** Render compact (no large submit button), used in tight spaces. */
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = createSignal(props.initial ?? "");
  const [debounced, setDebounced] = createSignal("");
  const [open, setOpen] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Plain server action via createResource, decoupled from the router so typing
  // never triggers a route transition/reload. `.latest` reads without suspending,
  // so the dropdown keeps showing the previous results while the next loads.
  const [resource] = createResource(
    () => (debounced().trim().length >= 2 ? debounced().trim() : null),
    (q) => searchAction(q),
  );
  const suggestions = () => resource.latest ?? EMPTY;

  function onInput(value: string) {
    setTerm(value);
    setOpen(true);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setDebounced(value), 200);
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const q = term().trim();
    track("search", { search_term: q });
    setOpen(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function go(href: string) {
    setOpen(false);
    navigate(href);
  }

  const hasSuggestions = () => {
    const s = suggestions();
    return !!s && s.colleges.length + s.courses.length + s.exams.length > 0;
  };

  return (
    <div class="relative w-full">
      <form
        role="search"
        action="/search"
        method="get"
        onSubmit={submit}
        class="flex items-center gap-2 bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-line)] p-1.5"
      >
        <span aria-hidden="true" class="pl-2 text-[var(--color-muted)]">
          ⌕
        </span>
        <input
          name="q"
          type="search"
          autocomplete="off"
          value={term()}
          onInput={(e) => onInput(e.currentTarget.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={props.placeholder ?? "Search colleges, courses or exams"}
          aria-label="Search colleges, courses or exams"
          aria-expanded={open() && hasSuggestions()}
          class="flex-1 bg-transparent py-2 px-1 outline-none text-sm min-w-0 text-[var(--color-ink)] placeholder:text-[var(--color-muted)]"
        />
        <button
          type="submit"
          class="shrink-0 bg-accent-500 hover:bg-accent-400 text-white font-semibold rounded-[var(--radius-md)] px-4 py-2 text-sm"
        >
          {props.compact ? "Go" : "Search"}
        </button>
      </form>

      <Show when={open() && hasSuggestions()}>
        <div class="absolute z-40 mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto">
          <Group label="Colleges" count={suggestions()!.colleges.length}>
            <For each={suggestions()!.colleges}>
              {(c) => (
                <Suggestion
                  onSelect={() => go(`/college/${c.slug}-${c.id}`)}
                  primary={c.name}
                  // city/type are not returned by the search endpoint; show them
                  // only if present, never a bare " · ".
                  secondary={[c.city, c.type].filter(Boolean).join(" · ") || "College"}
                />
              )}
            </For>
          </Group>
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
        </div>
      </Show>
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

function Suggestion(props: { onSelect: () => void; primary: string; secondary?: string }) {
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
      <Show when={props.secondary}>
        <span class="block text-xs text-[var(--color-muted)]">{props.secondary}</span>
      </Show>
    </button>
  );
}
