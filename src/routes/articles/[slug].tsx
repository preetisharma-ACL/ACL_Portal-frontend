import { useParams, type RouteDefinition } from "@solidjs/router";
import { articleQuery } from "~/lib/queries";
import ArticleDetailPage from "~/pages/ArticleDetailPage";

export const route = {
  preload: ({ params }) => {
    if (params.slug) void articleQuery(params.slug);
  },
} satisfies RouteDefinition;

export default function ArticleRoute() {
  const params = useParams();
  return <ArticleDetailPage slug={params.slug ?? ""} />;
}
