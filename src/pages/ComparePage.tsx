import { A, createAsync, useSearchParams } from "@solidjs/router";
import { For, Show, createEffect, type JSX } from "solid-js";
import Seo from "~/components/Seo";
import CollegeLogo from "~/components/CollegeLogo";
import LeadForm from "~/components/LeadForm";
import SlotImage from "~/components/SlotImage";
import { Card } from "~/components/ui";
import { compareQuery } from "~/lib/queries";
import { formatFeeRange, inrShort, titleCaseType } from "~/lib/format";
import { removeFromCompare, setCompareItems, MAX_COMPARE } from "~/lib/compareStore";
import type { CompareCollege } from "~/lib/types";

function parseIds(raw: string | undefined): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const part of (raw ?? "").split(",")) {
    const n = parseInt(part.trim(), 10);
    if (Number.isFinite(n) && n > 0 && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out.slice(0, MAX_COMPARE);
}

// A fresh node each call (Solid cannot reuse one element node in many cells).
const dash = () => <span class="text-[var(--color-muted)]">—</span>;

interface Row {
  label: string;
  /** Numeric value for best-in-row comparison (null = not comparable). */
  value?: (c: CompareCollege) => number | null;
  /** Which direction wins the row. */
  dir?: "min" | "max";
  render: (c: CompareCollege) => JSX.Element;
}

const ROWS: Row[] = [
  {
    label: "Rating",
    dir: "max",
    value: (c) => c.rating?.average ?? null,
    render: (c) =>
      c.rating?.average != null ? (
        <span class="inline-flex items-center gap-1 font-semibold">
          <span aria-hidden="true" class="text-[var(--color-warning)]">★</span>
          {c.rating.average.toFixed(1)}
          <span class="font-normal text-xs text-[var(--color-muted)]">({c.rating.count})</span>
        </span>
      ) : (
        dash()
      ),
  },
  {
    label: "Total fees",
    dir: "min",
    value: (c) => c.fee_range?.min ?? null,
    render: (c) => {
      const f = formatFeeRange(c.fee_range);
      return f ? (
        <span class="font-semibold">{f}</span>
      ) : (
        <span class="text-[var(--color-muted)]">Fees on request</span>
      );
    },
  },
  { label: "Type", render: (c) => (c.type ? <>{titleCaseType(c.type)}</> : dash()) },
  { label: "Location", render: (c) => (c.city ? <>{c.city}</> : dash()) },
  { label: "Established", render: (c) => (c.established_year != null ? <>{c.established_year}</> : dash()) },
  { label: "Affiliation", render: (c) => (c.affiliation ? <>{c.affiliation}</> : dash()) },
  {
    label: "Ranking",
    dir: "min",
    value: (c) => c.ranking?.rank ?? null,
    render: (c) =>
      c.ranking?.rank != null ? (
        <span>
          <span class="font-semibold">#{c.ranking.rank}</span>{" "}
          <span class="text-xs text-[var(--color-muted)]">
            {[c.ranking.agency, c.ranking.year].filter(Boolean).join(" ")}
          </span>
        </span>
      ) : (
        dash()
      ),
  },
  {
    label: "Placement rate",
    dir: "max",
    value: (c) => c.placements?.placement_pct ?? null,
    render: (c) =>
      c.placements?.placement_pct != null ? (
        <span class="font-semibold">{c.placements.placement_pct}%</span>
      ) : (
        dash()
      ),
  },
  {
    label: "Highest package",
    dir: "max",
    value: (c) => c.placements?.highest ?? null,
    render: (c) => (c.placements?.highest != null ? <>{inrShort(c.placements.highest)}</> : dash()),
  },
  {
    label: "Average package",
    dir: "max",
    value: (c) => c.placements?.average ?? null,
    render: (c) => (c.placements?.average != null ? <>{inrShort(c.placements.average)}</> : dash()),
  },
  {
    label: "Median package",
    dir: "max",
    value: (c) => c.placements?.median ?? null,
    render: (c) => (c.placements?.median != null ? <>{inrShort(c.placements.median)}</> : dash()),
  },
  { label: "Seats", render: (c) => (c.seats != null ? <>{c.seats}</> : dash()) },
  {
    label: "Key courses",
    render: (c) =>
      c.key_courses.length ? (
        <div class="flex flex-wrap gap-1">
          <For each={c.key_courses}>
            {(k) => (
              <span class="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                {k.name}
              </span>
            )}
          </For>
        </div>
      ) : (
        dash()
      ),
  },
  {
    label: "Exams accepted",
    render: (c) =>
      c.exams_accepted.length ? (
        <div class="flex flex-wrap gap-1">
          <For each={c.exams_accepted}>
            {(e) => (
              <span class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs">{e}</span>
            )}
          </For>
        </div>
      ) : (
        dash()
      ),
  },
  {
    label: "Approvals",
    render: (c) =>
      c.approvals.length ? (
        <div class="flex flex-wrap gap-1">
          <For each={c.approvals}>
            {(a) => (
              <span class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs">{a}</span>
            )}
          </For>
        </div>
      ) : (
        dash()
      ),
  },
];

export default function ComparePage() {
  const [sp, setSp] = useSearchParams();
  const ids = () => parseIds(sp.ids as string);
  const data = createAsync(() =>
    ids().length >= 2 ? compareQuery(ids()) : Promise.resolve({ colleges: [] }),
  );
  const colleges = () => data()?.colleges ?? [];

  // Keep the tray/store in sync with what the URL is actually comparing.
  createEffect(() => {
    const cs = colleges();
    if (cs.length) {
      setCompareItems(
        cs.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          logo: c.logo,
          city: c.city,
          type: c.type,
        })),
      );
    }
  });

  function removeCol(id: number) {
    const next = ids().filter((x) => x !== id);
    removeFromCompare(id);
    setSp({ ids: next.length ? next.join(",") : undefined });
  }

  function bestFor(row: Row): number | null {
    if (!row.dir || !row.value) return null;
    const vals = colleges()
      .map((c) => row.value!(c))
      .filter((v): v is number => v != null);
    if (new Set(vals).size < 2) return null;
    return row.dir === "min" ? Math.min(...vals) : Math.max(...vals);
  }

  return (
    <>
      <Seo
        title="Compare Colleges"
        description="Compare colleges side by side on fees, placements, ranking, approvals and more."
        canonical="/compare"
      />

      <section class="relative overflow-hidden bg-gradient-to-br from-primary-900 to-primary-700 text-white">
        <SlotImage slot="compare_header" overlay />
        <div class="container-x py-8 md:py-10 relative z-10">
          <h1 class="text-2xl md:text-3xl font-extrabold">Compare colleges</h1>
          <p class="mt-2 text-white/80">
            Side by side on fees, placements, ranking and more. Best value in each row is marked.
          </p>
        </div>
      </section>

      <div class="container-x py-8 pb-28">
        <Show
          when={colleges().length >= 2}
          fallback={
            <div class="mx-auto max-w-lg rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center">
              <h2 class="text-lg font-bold">Add colleges to compare</h2>
              <p class="mt-2 text-sm text-[var(--color-muted)]">
                Pick at least two colleges (up to four) to see them side by side. Use the "Add to
                compare" button on any college while browsing.
              </p>
              <div class="mt-5 flex flex-wrap justify-center gap-3">
                <A
                  href="/search"
                  class="inline-flex items-center rounded-[var(--radius-md)] bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Find colleges
                </A>
              </div>
            </div>
          }
        >
          {/* Scrollable comparison table; first column sticks on small screens. */}
          <div class="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-line)]">
            <table class="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th class="sticky left-0 z-[2] w-40 bg-[var(--color-canvas)] p-3 text-left align-bottom" />
                  <For each={colleges()}>
                    {(c) => (
                      <th class="min-w-[180px] border-l border-[var(--color-line)] bg-[var(--color-surface)] p-3 align-top">
                        <div class="flex flex-col items-center gap-2 text-center">
                          <CollegeLogo
                            name={c.name}
                            logo={c.logo ?? ""}
                            id={c.id}
                            class="h-12 w-12 rounded-[var(--radius-md)] text-base"
                          />
                          <A
                            href={`/college/${c.slug}-${c.id}`}
                            class="font-semibold leading-snug hover:text-primary-700"
                          >
                            {c.name}
                          </A>
                          <button
                            type="button"
                            onClick={() => removeCol(c.id)}
                            class="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                          >
                            Remove
                          </button>
                        </div>
                      </th>
                    )}
                  </For>
                  <Show when={colleges().length < MAX_COMPARE}>
                    <th class="min-w-[140px] border-l border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-center align-middle">
                      <A
                        href="/search"
                        class="inline-flex flex-col items-center gap-1 text-sm font-semibold text-primary-700 hover:underline"
                      >
                        <span class="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-primary-300 text-2xl">
                          +
                        </span>
                        Add college
                      </A>
                    </th>
                  </Show>
                </tr>
              </thead>
              <tbody>
                <For each={ROWS}>
                  {(row) => {
                    const best = bestFor(row);
                    return (
                      <tr class="border-t border-[var(--color-line)]">
                        <th
                          scope="row"
                          class="sticky left-0 z-[1] w-40 bg-[var(--color-canvas)] p-3 text-left align-top font-semibold text-[var(--color-ink)]/80"
                        >
                          {row.label}
                        </th>
                        <For each={colleges()}>
                          {(c) => {
                            const v = row.value?.(c) ?? null;
                            const isBest = best != null && v != null && v === best;
                            return (
                              <td
                                class="border-l border-[var(--color-line)] p-3 align-top"
                                classList={{ "bg-[var(--color-success)]/10": isBest }}
                              >
                                <div class="flex items-start gap-1.5">
                                  <span class="min-w-0">{row.render(c)}</span>
                                  <Show when={isBest}>
                                    <span class="shrink-0 rounded-full bg-[var(--color-success)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-success)]">
                                      Best
                                    </span>
                                  </Show>
                                </div>
                              </td>
                            );
                          }}
                        </For>
                        <Show when={colleges().length < MAX_COMPARE}>
                          <td class="border-l border-[var(--color-line)] bg-[var(--color-canvas)]/40 p-3" />
                        </Show>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>

          {/* Page-level lead CTA, framed at the set being compared */}
          <Card class="mt-8 p-5 sm:p-6 bg-primary-50 border-primary-100">
            <LeadForm
              sourcePage="/compare"
              heading="Get admission guidance for these colleges"
              defaultCity={colleges()[0]?.city ?? undefined}
            />
          </Card>
        </Show>
      </div>
    </>
  );
}
