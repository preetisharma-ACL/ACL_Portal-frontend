import { useNavigate } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import { track } from "~/lib/analytics";

const SCOPES = [
  { value: "all", label: "All" },
  { value: "colleges", label: "Colleges" },
  { value: "courses", label: "Courses" },
  { value: "exams", label: "Exams" },
];

/** Primary homepage search across colleges, courses and exams. */
export default function HeroSearch() {
  const navigate = useNavigate();
  const [scope, setScope] = createSignal("all");
  let input: HTMLInputElement | undefined;

  function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    const q = input?.value.trim() ?? "";
    track("search", { search_term: q, scope: scope() });
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (scope() !== "all") params.set("type", scope());
    navigate(`/search?${params.toString()}`);
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
      <form
        role="search"
        onSubmit={onSubmit}
        class="flex items-center gap-2 bg-white rounded-[var(--radius-lg)] p-1.5 shadow-lg"
      >
        <input
          ref={input}
          name="q"
          type="search"
          placeholder="Try MBA colleges in Varanasi, or CAT exam"
          aria-label="Search colleges, courses or exams"
          class="flex-1 px-3 py-2.5 outline-none text-[var(--color-ink)] min-w-0"
        />
        <button
          type="submit"
          class="shrink-0 bg-accent-500 hover:bg-accent-400 text-[var(--color-ink)] font-semibold px-5 py-2.5 rounded-[var(--radius-md)]"
        >
          Search
        </button>
      </form>
    </div>
  );
}
