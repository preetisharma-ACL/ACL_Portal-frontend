import { createAsync } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { reviewsQuery } from "~/lib/queries";
import { submitReviewAction } from "~/lib/actions";
import { Badge, Button } from "./ui";
import { StarPicker, StarRating } from "./Stars";
import { formatDate as fmtDate } from "~/lib/format";
import type { ReviewPayload } from "~/lib/types";

const SUB_LABELS: { key: keyof ReviewPayload; label: string }[] = [
  { key: "placements", label: "Placements" },
  { key: "faculty", label: "Faculty" },
  { key: "infrastructure", label: "Infrastructure" },
  { key: "campus_life", label: "Campus life" },
];

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-primary-500";

export default function ReviewsBlock(props: { slugId: string; collegeId: number }) {
  const [page, setPage] = createSignal(1);
  const data = createAsync(() => reviewsQuery(props.slugId, page()));

  const summary = () => data()?.summary;
  const results = () => data()?.results ?? [];
  const pag = () => data()?.pagination;
  const totalPages = () => {
    const p = pag();
    return p ? Math.max(1, Math.ceil(p.total / p.page_size)) : 1;
  };

  // Write-a-review form state
  const [open, setOpen] = createSignal(false);
  const [name, setName] = createSignal("");
  const [context, setContext] = createSignal("");
  const [overall, setOverall] = createSignal(0);
  const [subs, setSubs] = createSignal<Record<string, number>>({});
  const [title, setTitle] = createSignal("");
  const [body, setBody] = createSignal("");
  const [hp, setHp] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  const canSubmit = () =>
    name().trim().length >= 2 &&
    overall() > 0 &&
    title().trim().length >= 2 &&
    body().trim().length >= 5 &&
    !busy();

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit()) {
      setError("Please add your name, an overall rating, a title and a short review.");
      return;
    }
    const payload: ReviewPayload = {
      author_name: name().trim(),
      author_context: context().trim() || undefined,
      overall_rating: overall(),
      title: title().trim(),
      body: body().trim(),
      hp_field: hp(),
      ...subs(),
    };
    setBusy(true);
    try {
      const res = await submitReviewAction(props.collegeId, payload);
      if (res) {
        setSuccess(true);
      } else {
        setError("We could not submit your review. Please try again.");
      }
    } catch (err) {
      console.error("Review submit failed", err);
      setError("Something went wrong submitting your review. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Aggregate header */}
      <Show
        when={summary() && summary()!.count > 0}
        fallback={
          <div class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-canvas)] p-6 text-center">
            <p class="font-semibold">No reviews yet. Be the first to review this college.</p>
            <p class="mt-1 text-sm text-[var(--color-muted)]">
              Share your experience to help other students decide.
            </p>
          </div>
        }
      >
        <div class="grid gap-6 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:grid-cols-[auto_1fr]">
          <div class="flex flex-col items-center justify-center sm:pr-6 sm:border-r sm:border-[var(--color-line)]">
            <span class="text-4xl font-extrabold text-primary-700">
              {summary()!.average_overall.toFixed(1)}
            </span>
            <StarRating value={summary()!.average_overall} class="mt-1" />
            <span class="mt-1 text-xs text-[var(--color-muted)]">
              {summary()!.count} review{summary()!.count === 1 ? "" : "s"}
            </span>
          </div>
          <div class="space-y-3">
            {/* Distribution 5 -> 1 */}
            <div class="space-y-1.5">
              <For each={[5, 4, 3, 2, 1]}>
                {(star) => {
                  const n = () => summary()!.distribution[String(star)] ?? 0;
                  const pct = () => (summary()!.count ? (n() / summary()!.count) * 100 : 0);
                  return (
                    <div class="flex items-center gap-2 text-xs">
                      <span class="w-8 shrink-0 text-[var(--color-muted)]">{star} ★</span>
                      <span class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-canvas)]">
                        <span
                          class="block h-full rounded-full bg-[var(--color-warning)]"
                          style={{ width: `${pct()}%` }}
                        />
                      </span>
                      <span class="w-6 shrink-0 text-right text-[var(--color-muted)]">{n()}</span>
                    </div>
                  );
                }}
              </For>
            </div>
            {/* Sub-rating averages */}
            <Show when={summary()!.sub_averages}>
              <div class="flex flex-wrap gap-2 pt-1">
                <For each={SUB_LABELS}>
                  {(s) => {
                    const val = () =>
                      (summary()!.sub_averages as Record<string, number | undefined>)[s.key as string];
                    return (
                      <Show when={val() != null}>
                        <span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-3 py-1 text-xs">
                          <span class="text-[var(--color-muted)]">{s.label}</span>
                          <span class="font-semibold text-[var(--color-ink)]">
                            {val()!.toFixed(1)}
                          </span>
                        </span>
                      </Show>
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Write a review toggle */}
      <div class="mt-4">
        <Show when={!open() && !success()}>
          <Button variant="outline" size="md" onClick={() => setOpen(true)}>
            Write a review
          </Button>
        </Show>
      </div>

      {/* Success (pending moderation) */}
      <Show when={success()}>
        <div class="mt-4 rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4">
          <p class="font-semibold text-[var(--color-success)]">Thanks, your review was submitted.</p>
          <p class="mt-1 text-sm text-[var(--color-ink)]/80">
            It will appear here once our team has reviewed it. We moderate submissions to keep this
            section useful.
          </p>
        </div>
      </Show>

      {/* Write a review form */}
      <Show when={open() && !success()}>
        <form
          onSubmit={onSubmit}
          novalidate
          class="mt-4 space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
        >
          <h3 class="font-semibold">Write a review</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-medium">Your name</span>
              <input class={inputClass} value={name()} onInput={(e) => setName(e.currentTarget.value)} required />
            </label>
            <label class="block">
              <span class="mb-1 block text-sm font-medium">
                Context <span class="text-[var(--color-muted)]">(optional)</span>
              </span>
              <input
                class={inputClass}
                placeholder="e.g. MBA, Batch 2023"
                value={context()}
                onInput={(e) => setContext(e.currentTarget.value)}
              />
            </label>
          </div>

          <div>
            <span class="mb-1 block text-sm font-medium">Overall rating</span>
            <StarPicker value={overall()} onChange={setOverall} />
          </div>

          <div class="grid gap-2 sm:grid-cols-2">
            <For each={SUB_LABELS}>
              {(s) => (
                <StarPicker
                  label={s.label}
                  value={subs()[s.key as string] ?? 0}
                  onChange={(n) => setSubs({ ...subs(), [s.key as string]: n })}
                />
              )}
            </For>
          </div>

          <label class="block">
            <span class="mb-1 block text-sm font-medium">Title</span>
            <input class={inputClass} value={title()} onInput={(e) => setTitle(e.currentTarget.value)} required />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Your review</span>
            <textarea
              class={`${inputClass} min-h-[100px]`}
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

          <p class="text-xs text-[var(--color-muted)]">
            Reviews are published after moderation. Please keep it factual and respectful.
          </p>
          <div class="flex gap-2">
            <Button type="submit" variant="accent" size="md" disabled={!canSubmit()}>
              {busy() ? "Submitting..." : "Submit review"}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Show>

      {/* Review list */}
      <Show when={results().length}>
        <ul class="mt-6 space-y-4">
          <For each={results()}>
            {(r) => (
              <li class="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-semibold">{r.author_name}</p>
                    <Show when={r.author_context}>
                      <p class="text-xs text-[var(--color-muted)]">{r.author_context}</p>
                    </Show>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <Show when={r.is_verified}>
                      <Badge tone="success">✓ Verified</Badge>
                    </Show>
                    <StarRating value={r.overall_rating} showValue />
                  </div>
                </div>
                <h4 class="mt-3 font-semibold">{r.title}</h4>
                <p class="mt-1 text-sm text-[var(--color-ink)]/90">{r.body}</p>
                <p class="mt-2 text-xs text-[var(--color-muted)]">{fmtDate(r.created_at)}</p>
              </li>
            )}
          </For>
        </ul>

        {/* Pagination */}
        <Show when={totalPages() > 1}>
          <div class="mt-5 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page() <= 1}
              onClick={() => setPage(page() - 1)}
            >
              Previous
            </Button>
            <span class="text-sm text-[var(--color-muted)]">
              Page {page()} of {totalPages()}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pag()?.has_next}
              onClick={() => setPage(page() + 1)}
            >
              Next
            </Button>
          </div>
        </Show>
      </Show>
    </div>
  );
}
