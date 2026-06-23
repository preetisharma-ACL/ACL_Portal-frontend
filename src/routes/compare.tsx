import { type RouteDefinition } from "@solidjs/router";
import { compareQuery } from "~/lib/queries";
import ComparePage from "~/pages/ComparePage";

function parseIds(raw: string): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const part of raw.split(",")) {
    const n = parseInt(part.trim(), 10);
    if (Number.isFinite(n) && n > 0 && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out.slice(0, 4);
}

export const route = {
  preload: ({ location }) => {
    const raw = new URLSearchParams(location.search).get("ids") ?? "";
    const ids = parseIds(raw);
    if (ids.length >= 2) void compareQuery(ids);
  },
} satisfies RouteDefinition;

export default function CompareRoute() {
  return <ComparePage />;
}
