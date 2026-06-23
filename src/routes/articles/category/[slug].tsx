import { useParams, type RouteDefinition } from "@solidjs/router";
import { articleCategoriesQuery, articlesQuery } from "~/lib/queries";
import ArticlesListing from "~/pages/ArticlesListing";

export const route = {
  preload: ({ params, location }) => {
    const page = new URLSearchParams(location.search).get("page") ?? "1";
    void articlesQuery({ page, category: params.slug });
    void articleCategoriesQuery();
  },
} satisfies RouteDefinition;

export default function ArticleCategoryRoute() {
  const params = useParams();
  return <ArticlesListing category={params.slug} />;
}
