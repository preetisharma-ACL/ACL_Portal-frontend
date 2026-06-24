import { createAsync } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { questionsQuery } from "~/lib/queries";
import { submitAnswerAction, submitQuestionAction } from "~/lib/actions";
import { Badge, Button } from "./ui";
import { formatDate as fmtDate } from "~/lib/format";

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-primary-500";

const PENDING_MSG = "Submitted. It will appear here once our team has reviewed it.";

/** Shared name + body + honeypot form for asking a question or answering one. */
function PostForm(props: {
  submitLabel: string;
  bodyLabel: string;
  bodyPlaceholder?: string;
  onSubmit: (name: string, body: string, hp: string) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [name, setName] = createSignal("");
  const [body, setBody] = createSignal("");
  const [hp, setHp] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [done, setDone] = createSignal(false);

  const canSubmit = () => name().trim().length >= 2 && body().trim().length >= 5 && !busy();

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit()) {
      setError("Please add your name and a bit more detail.");
      return;
    }
    setBusy(true);
    try {
      const res = await props.onSubmit(name().trim(), body().trim(), hp());
      if (res) setDone(true);
      else setError("We could not submit this. Please try again.");
    } catch (err) {
      console.error("Q&A submit failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Show
      when={!done()}
      fallback={
        <p class="rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-ink)]/80">
          <span class="font-semibold text-[var(--color-success)]">Thanks. </span>
          {PENDING_MSG}
        </p>
      }
    >
      <form onSubmit={submit} novalidate class="space-y-3">
        <label class="block">
          <span class="mb-1 block text-sm font-medium">Your name</span>
          <input class={inputClass} value={name()} onInput={(e) => setName(e.currentTarget.value)} required />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium">{props.bodyLabel}</span>
          <textarea
            class={`${inputClass} min-h-[80px]`}
            placeholder={props.bodyPlaceholder}
            value={body()}
            onInput={(e) => setBody(e.currentTarget.value)}
            required
          />
        </label>

        {/* Honeypot: hidden from people and autofill. Must stay empty. */}
        <div class="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <input
            type="text"
            tabindex="-1"
            autocomplete="off"
            name="acl_hp"
            value={hp()}
            onInput={(e) => setHp(e.currentTarget.value)}
          />
        </div>

        <Show when={error()}>
          <p class="text-sm text-[var(--color-danger)]" role="alert">
            {error()}
          </p>
        </Show>
        <p class="text-xs text-[var(--color-muted)]">Posts appear after moderation.</p>
        <div class="flex gap-2">
          <Button type="submit" variant="accent" size="sm" disabled={!canSubmit()}>
            {busy() ? "Submitting..." : props.submitLabel}
          </Button>
          <Show when={props.onCancel}>
            <Button type="button" variant="ghost" size="sm" onClick={() => props.onCancel?.()}>
              Cancel
            </Button>
          </Show>
        </div>
      </form>
    </Show>
  );
}

export default function QABlock(props: { slugId: string; collegeId: number }) {
  const [page, setPage] = createSignal(1);
  const data = createAsync(() => questionsQuery(props.slugId, page()));
  const results = () => data()?.results ?? [];
  const pag = () => data()?.pagination;
  const totalPages = () => {
    const p = pag();
    return p ? Math.max(1, Math.ceil(p.total / p.page_size)) : 1;
  };

  const [askOpen, setAskOpen] = createSignal(false);
  const [answerFor, setAnswerFor] = createSignal<number | null>(null);

  return (
    <div>
      {/* Ask a question */}
      <div class="mb-4">
        <Show
          when={askOpen()}
          fallback={
            <Button variant="outline" size="md" onClick={() => setAskOpen(true)}>
              Ask a question
            </Button>
          }
        >
          <div class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 class="mb-3 font-semibold">Ask a question</h3>
            <PostForm
              submitLabel="Submit question"
              bodyLabel="Your question"
              bodyPlaceholder="e.g. Are hostel facilities available on campus?"
              onCancel={() => setAskOpen(false)}
              onSubmit={(name, body, hp) =>
                submitQuestionAction(props.collegeId, { author_name: name, body, hp_field: hp })
              }
            />
          </div>
        </Show>
      </div>

      {/* Question list / empty state */}
      <Show
        when={results().length}
        fallback={
          <div class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-canvas)] p-6 text-center">
            <p class="font-semibold">No questions yet. Ask the first one.</p>
            <p class="mt-1 text-sm text-[var(--color-muted)]">
              Ask about admissions, hostels, placements or anything else.
            </p>
          </div>
        }
      >
        <ul class="space-y-4">
          <For each={results()}>
            {(q) => (
              <li class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <p class="font-semibold">{q.body}</p>
                <p class="mt-1 text-xs text-[var(--color-muted)]">
                  Asked by {q.author_name} · {fmtDate(q.created_at)}
                </p>

                {/* Answers */}
                <Show when={q.answers.length}>
                  <ul class="mt-3 space-y-3 border-l-2 border-[var(--color-line)] pl-4">
                    <For each={q.answers}>
                      {(a) => (
                        <li>
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-semibold">{a.author_name}</span>
                            <Show when={a.is_official}>
                              <Badge tone="primary">Official</Badge>
                            </Show>
                            <span class="text-xs text-[var(--color-muted)]">
                              {fmtDate(a.created_at)}
                            </span>
                          </div>
                          <p class="mt-0.5 text-sm text-[var(--color-ink)]/90">{a.body}</p>
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>

                {/* Answer affordance */}
                <div class="mt-3">
                  <Show
                    when={answerFor() === q.id}
                    fallback={
                      <button
                        type="button"
                        onClick={() => setAnswerFor(q.id)}
                        class="text-sm font-semibold text-primary-700 hover:underline"
                      >
                        Answer this question
                      </button>
                    }
                  >
                    <div class="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
                      <PostForm
                        submitLabel="Submit answer"
                        bodyLabel="Your answer"
                        onCancel={() => setAnswerFor(null)}
                        onSubmit={(name, body, hp) =>
                          submitAnswerAction(q.id, { author_name: name, body, hp_field: hp })
                        }
                      />
                    </div>
                  </Show>
                </div>
              </li>
            )}
          </For>
        </ul>

        {/* Pagination */}
        <Show when={totalPages() > 1}>
          <div class="mt-5 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page() <= 1} onClick={() => setPage(page() - 1)}>
              Previous
            </Button>
            <span class="text-sm text-[var(--color-muted)]">
              Page {page()} of {totalPages()}
            </span>
            <Button variant="outline" size="sm" disabled={!pag()?.has_next} onClick={() => setPage(page() + 1)}>
              Next
            </Button>
          </div>
        </Show>
      </Show>
    </div>
  );
}
