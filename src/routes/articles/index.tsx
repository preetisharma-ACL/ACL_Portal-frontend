import { type RouteDefinition } from "@solidjs/router";
import { articleCategoriesQuery, articlesQuery } from "~/lib/queries";
import ArticlesListing from "~/pages/ArticlesListing";

export const route = {
  preload: ({ location }) => {
    const page = new URLSearchParams(location.search).get("page") ?? "1";
    void articlesQuery({ page });
    void articleCategoriesQuery();
  },
} satisfies RouteDefinition;

export default function ArticlesIndexRoute() {
  return <ArticlesListing />;
}
