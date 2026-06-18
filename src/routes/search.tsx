import { useSearchParams, type RouteDefinition } from "@solidjs/router";
import Seo from "~/components/Seo";
import SearchPage from "~/pages/SearchPage";
import { searchQuery } from "~/lib/queries";

export const route = {
  preload: ({ location }) => {
    const q = new URLSearchParams(location.search).get("q") ?? "";
    if (q) void searchQuery(q);
  },
} satisfies RouteDefinition;

export default function SearchRoute() {
  const [sp] = useSearchParams();
  const q = () => (sp.q as string) || "";
  return (
    <>
      <Seo
        title={q() ? `Search results for "${q()}"` : "Search colleges, courses and exams"}
        description="Search across colleges, courses and entrance exams to compare options that fit your goals."
        canonical="/search"
        noindex
      />
      <SearchPage query={q()} />
    </>
  );
}
